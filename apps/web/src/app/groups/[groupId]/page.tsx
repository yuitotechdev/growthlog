'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGroup } from '@/features/group/hooks/useGroups';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { ApiClient } from '@growthlog/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { GroupSettings } from '@/features/group/components/GroupSettings';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type TabType = 'activities' | 'rankings' | 'chat' | 'members' | 'settings';

interface SharedActivity {
  id: string;
  sharedAt: string;
  activity: {
    id: string;
    title: string;
    category: string;
    durationMinutes: number;
    mood: number;
    note: string | null;
    date: string;
    user: {
      id: string;
      username: string | null;
      uniqueId: string | null;
      avatarEmoji: string | null;
    };
  };
}

interface RankingItem {
  rank: number;
  user: { id: string; username: string | null; uniqueId: string | null; avatarEmoji: string | null } | null;
  value: number;
  label: string;
}

interface Rankings {
  byDuration: RankingItem[];
  byCount: RankingItem[];
  byMood: RankingItem[];
}

interface ChatMessage {
  id: string;
  groupId: string;
  user: { id: string; username: string | null; uniqueId: string | null; avatarEmoji: string | null } | null;
  content: string;
  createdAt: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { group, isLoading, error, inviteMember, removeMember, regenerateInviteCode } = useGroup(groupId);
  const { profile } = useProfile();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('activities');
  const [activities, setActivities] = useState<SharedActivity[]>([]);
  const [rankings, setRankings] = useState<Rankings | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isGeneratingMvp, setIsGeneratingMvp] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = group?.owner?.id === profile?.id;

  // 期間設定（過去30日間）
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // データ取得
  useEffect(() => {
    if (!token || !groupId) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      const client = new ApiClient({ baseUrl: API_BASE_URL, getToken: () => token });

      try {
        if (activeTab === 'activities') {
          const data = await client.get<SharedActivity[]>(`/api/groups/${groupId}/activities`);
          setActivities(data || []);
        } else if (activeTab === 'rankings') {
          const data = await client.get<Rankings>(`/api/groups/${groupId}/rankings?startDate=${startDate}&endDate=${endDate}`);
          setRankings(data);
        } else if (activeTab === 'chat') {
          const data = await client.get<ChatMessage[]>(`/api/groups/${groupId}/messages`);
          setMessages(data || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [token, groupId, activeTab, startDate, endDate]);

  // チャット自動更新
  useEffect(() => {
    if (activeTab === 'chat' && token && groupId) {
      const fetchMessages = async () => {
        const client = new ApiClient({ baseUrl: API_BASE_URL, getToken: () => token });
        try {
          const data = await client.get<ChatMessage[]>(`/api/groups/${groupId}/messages`);
          setMessages(data || []);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };

      chatIntervalRef.current = setInterval(fetchMessages, 5000);
      return () => {
        if (chatIntervalRef.current) {
          clearInterval(chatIntervalRef.current);
        }
      };
    }
  }, [activeTab, token, groupId]);

  // チャットスクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !token) return;

    try {
      const client = new ApiClient({ baseUrl: API_BASE_URL, getToken: () => token });
      const sent = await client.post<ChatMessage>(`/api/groups/${groupId}/messages`, { content: newMessage });
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
    } catch (err: any) {
      showMessage('error', err.message || 'メッセージの送信に失敗しました');
    }
  };

  const handleCopyInviteLink = () => {
    if (!group) return;
    const inviteUrl = `${window.location.origin}/groups/join/${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleInviteByUserId = async () => {
    if (!inviteUserId.trim()) {
      showMessage('error', 'ユーザーIDを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteMember(inviteUserId.trim());
      showMessage('success', 'ユーザーを招待しました');
      setInviteUserId('');
      setShowInviteModal(false);
    } catch (err: any) {
      showMessage('error', err.message || '招待に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`${memberName}さんをグループから削除しますか？`)) return;

    try {
      await removeMember(memberId);
      showMessage('success', 'メンバーを削除しました');
    } catch (err: any) {
      showMessage('error', err.message || 'メンバーの削除に失敗しました');
    }
  };

  const handleGenerateMvp = async () => {
    if (!token || !groupId) return;

    setIsGeneratingMvp(true);
    try {
      const client = new ApiClient({ baseUrl: API_BASE_URL, getToken: () => token });
      await client.post(`/api/groups/${groupId}/mvp`);
      showMessage('success', '今週のMVPを生成してチャットに投稿しました！');
      // チャットタブに切り替えて投稿を確認
      setActiveTab('chat');
      // メッセージを再取得
      const messages = await client.get<ChatMessage[]>(`/api/groups/${groupId}/messages`);
      setMessages(messages || []);
    } catch (err: any) {
      showMessage('error', err.message || 'MVPの生成に失敗しました');
    } finally {
      setIsGeneratingMvp(false);
    }
  };

  const moodEmoji = (mood: number) => ['😢', '😐', '🙂', '😊', '😄'][mood - 1] || '🙂';
  const rankEmoji = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;

  if (isLoading) return <Loading />;

  if (error || !group) {
    return (
      <div className="error-page">
        <h1>⚠️ エラー</h1>
        <p>{error || 'グループが見つかりません'}</p>
        <Link href="/groups" className="back-link">← グループ一覧に戻る</Link>
      </div>
    );
  }

  return (
    <div className="group-detail-page">
      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="breadcrumb">
        <Link href="/groups">グループ</Link>
        <span className="separator">›</span>
        <span>{group.name}</span>
      </div>

      <div className="page-header">
        <div className="header-content">
          <h1>{group.name}</h1>
          {group.description && <p className="description">{group.description}</p>}
        </div>
        <div className="header-actions">
          <button className="invite-link-btn" onClick={handleCopyInviteLink}>
            {copiedInvite ? '✓ コピー済み' : '🔗 招待リンク'}
          </button>
          {isOwner && (
            <button className="invite-btn" onClick={() => setShowInviteModal(true)}>
              ➕ メンバー招待
            </button>
          )}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>
          📝 共有活動
        </button>
        <button className={`tab ${activeTab === 'rankings' ? 'active' : ''}`} onClick={() => setActiveTab('rankings')}>
          🏆 ランキング
        </button>
        <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          💬 チャット
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          👥 メンバー ({group.members?.length || 0})
        </button>
        {isOwner && (
          <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            ⚙️ 設定
          </button>
        )}
      </div>

      {/* タブコンテンツ */}
      <div className="tab-content">
        {activeTab === 'activities' && (
          <div className="activities-tab">
            {isLoadingData ? (
              <Loading />
            ) : activities.length === 0 ? (
              <EmptyState
                icon="📝"
                title="共有された活動がありません"
                description="メンバーが活動を共有すると、ここに表示されます"
              />
            ) : (
              <div className="shared-activities-list">
                {activities.map((item) => (
                  <div key={item.id} className="shared-activity-card">
                    <div className="activity-user">
                      <div className="user-avatar">
                        {item.activity.user?.avatarEmoji ? (
                          <span className="activity-user-emoji">{item.activity.user.avatarEmoji}</span>
                        ) : (
                          <span>{(item.activity.user?.username || '??').slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="user-name">{item.activity.user?.username || 'ユーザー'}</span>
                    </div>
                    <div className="activity-content">
                      <h4>{item.activity.title}</h4>
                      <div className="activity-meta">
                        <span className="meta-item">📅 {item.activity.date}</span>
                        <span className="meta-item">⏱️ {item.activity.durationMinutes}分</span>
                        <span className="meta-item">{moodEmoji(item.activity.mood)}</span>
                        <span className="category-badge">{item.activity.category}</span>
                      </div>
                      {item.activity.note && <p className="activity-note">{item.activity.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="rankings-tab">
            {isOwner && rankings && (rankings.byDuration.length > 0 || rankings.byCount.length > 0) && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="mvp-generate-btn"
                  onClick={handleGenerateMvp}
                  disabled={isGeneratingMvp}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: isGeneratingMvp ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    opacity: isGeneratingMvp ? 0.7 : 1,
                  }}
                >
                  {isGeneratingMvp ? '生成中...' : '🏆 今週のMVPを生成して投稿'}
                </button>
              </div>
            )}
            {isLoadingData ? (
              <Loading />
            ) : !rankings || (rankings.byDuration.length === 0 && rankings.byCount.length === 0) ? (
              <EmptyState
                icon="🏆"
                title="ランキングデータがありません"
                description="メンバーが活動を共有すると、ランキングが表示されます"
              />
            ) : (
              <div className="rankings-grid">
                <div className="ranking-card">
                  <h3>⏱️ 活動時間ランキング</h3>
                  <div className="ranking-list">
                    {rankings.byDuration.map((item) => (
                      <div key={item.user?.id || item.rank} className={`ranking-item rank-${item.rank}`}>
                        <span className="rank">{rankEmoji(item.rank)}</span>
                        <div className="ranking-user">
                          <div className="ranking-avatar">
                            {item.user?.avatarEmoji ? (
                              <span className="activity-user-emoji">{item.user.avatarEmoji}</span>
                            ) : (
                              <span>{(item.user?.username || '??').slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <span>{item.user?.username || 'ユーザー'}</span>
                        </div>
                        <span className="ranking-value">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ranking-card">
                  <h3>📊 活動回数ランキング</h3>
                  <div className="ranking-list">
                    {rankings.byCount.map((item) => (
                      <div key={item.user?.id || item.rank} className={`ranking-item rank-${item.rank}`}>
                        <span className="rank">{rankEmoji(item.rank)}</span>
                        <div className="ranking-user">
                          <div className="ranking-avatar">
                            {item.user?.avatarEmoji ? (
                              <span className="activity-user-emoji">{item.user.avatarEmoji}</span>
                            ) : (
                              <span>{(item.user?.username || '??').slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <span>{item.user?.username || 'ユーザー'}</span>
                        </div>
                        <span className="ranking-value">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ranking-card">
                  <h3>😊 平均気分ランキング</h3>
                  <div className="ranking-list">
                    {rankings.byMood.map((item) => (
                      <div key={item.user?.id || item.rank} className={`ranking-item rank-${item.rank}`}>
                        <span className="rank">{rankEmoji(item.rank)}</span>
                        <div className="ranking-user">
                          <div className="ranking-avatar">
                            {item.user?.avatarEmoji ? (
                              <span className="activity-user-emoji">{item.user.avatarEmoji}</span>
                            ) : (
                              <span>{(item.user?.username || '??').slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <span>{item.user?.username || 'ユーザー'}</span>
                        </div>
                        <span className="ranking-value">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-tab">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <span>💬</span>
                  <p>メッセージはまだありません</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.user?.id === profile?.id ? 'own' : ''}`}>
                    {msg.user?.id !== profile?.id && (
                      <div className="message-avatar">
                        {msg.user?.avatarEmoji ? (
                          <span className="activity-user-emoji">{msg.user.avatarEmoji}</span>
                        ) : (
                          <span>{(msg.user?.username || '??').slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      {msg.user?.id !== profile?.id && (
                        <span className="message-sender">{msg.user?.username || 'ユーザー'}</span>
                      )}
                      <div className="message-bubble">{msg.content}</div>
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="メッセージを入力..."
                className="input"
              />
              <button className="send-btn" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                送信
              </button>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-tab">
            <div className="members-list">
              {group.members?.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-avatar">
                    {member.user?.avatarEmoji ? (
                      <span className="activity-user-emoji">{member.user.avatarEmoji}</span>
                    ) : (
                      <span>{(member.user?.username || '??').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="member-info">
                    <span className="member-name">
                      {member.user?.username || 'ユーザー'}
                      {member.role === 'owner' && <span className="role-badge">オーナー</span>}
                    </span>
                    {member.user?.uniqueId && (
                      <span className="member-id">@{member.user.uniqueId}</span>
                    )}
                  </div>
                  {isOwner && member.role !== 'owner' && (
                    <button
                      className="remove-member-btn"
                      onClick={() => handleRemoveMember(member.user?.id || '', member.user?.username || 'このユーザー')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="invite-section">
              <h3>🔗 招待</h3>
              <div className="invite-code-box">
                <code>{group.inviteCode}</code>
                <button onClick={handleCopyInviteLink}>
                  {copiedInvite ? '✓' : '📋'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isOwner && (
          <GroupSettings
            group={group}
            onUpdate={() => {
              showMessage('success', 'グループ設定を更新しました');
            }}
          />
        )}
      </div>

      {/* 招待モーダル */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ユーザーを招待</h3>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label>ユーザーID</label>
              <div className="input-with-prefix">
                <span className="prefix">@</span>
                <input
                  type="text"
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="user123"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowInviteModal(false)}>キャンセル</button>
              <button className="submit-btn" onClick={handleInviteByUserId} disabled={isSubmitting}>
                {isSubmitting ? '招待中...' : '招待する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .group-detail-page {
          max-width: 1000px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .toast {
          position: fixed;
          top: 100px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }
        .toast.success { border-left: 4px solid #10b981; }
        .toast.error { border-left: 4px solid #ef4444; }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        .breadcrumb a { color: #6366f1; text-decoration: none; }
        .separator { color: #cbd5e1; }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .header-content h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .description {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .invite-link-btn, .invite-btn {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .invite-link-btn {
          background: rgba(255, 255, 255, 0.8);
          color: #6366f1;
          border: 2px solid rgba(99, 102, 241, 0.2);
        }
        .invite-link-btn:hover {
          background: white;
          border-color: #6366f1;
        }

        .invite-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .invite-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        /* タブ */
        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid rgba(99, 102, 241, 0.1);
          padding-bottom: 0.5rem;
          overflow-x: auto;
        }

        .tab {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 12px;
          background: transparent;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab:hover {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .tab.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .tab-content {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 1.5rem;
          min-height: 400px;
        }

        /* 共有活動タブ */
        .shared-activities-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .shared-activity-card {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }

        .shared-activity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
        }

        .activity-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .user-avatar, .ranking-avatar, .member-avatar, .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .user-avatar img, .ranking-avatar img, .member-avatar img, .message-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-avatar span, .ranking-avatar span, .member-avatar span, .message-avatar span {
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .activity-user-emoji {
          font-size: 1.5rem;
          line-height: 1;
        }

        .user-name {
          font-weight: 600;
          color: #1e293b;
        }

        .activity-content h4 {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
          color: #1e293b;
        }

        .activity-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }

        .meta-item {
          font-size: 0.85rem;
          color: #64748b;
        }

        .category-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.6rem;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border-radius: 6px;
          font-weight: 500;
        }

        .activity-note {
          margin-top: 0.75rem;
          font-size: 0.9rem;
          color: #475569;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
        }

        /* ランキングタブ */
        .rankings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
        }

        .ranking-card {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          padding: 1.25rem;
        }

        .ranking-card h3 {
          margin: 0 0 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .ranking-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .ranking-item.rank-1 {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%);
          border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .ranking-item.rank-2 {
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.15) 0%, rgba(158, 158, 158, 0.1) 100%);
          border: 1px solid rgba(192, 192, 192, 0.3);
        }

        .ranking-item.rank-3 {
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.15) 0%, rgba(176, 141, 87, 0.1) 100%);
          border: 1px solid rgba(205, 127, 50, 0.3);
        }

        .rank {
          font-size: 1.25rem;
          min-width: 32px;
          text-align: center;
        }

        .ranking-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .ranking-value {
          font-weight: 700;
          color: #6366f1;
        }

        /* チャットタブ */
        .chat-tab {
          display: flex;
          flex-direction: column;
          height: 500px;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
        }

        .chat-empty span {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .chat-message {
          display: flex;
          gap: 0.75rem;
          max-width: 80%;
        }

        .chat-message.own {
          margin-left: auto;
          flex-direction: row-reverse;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .chat-message.own .message-content {
          align-items: flex-end;
        }

        .message-sender {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .message-bubble {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          font-size: 0.95rem;
          color: #1e293b;
          line-height: 1.5;
        }

        .chat-message.own .message-bubble {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
        }

        .message-time {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .chat-input {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .chat-input .input {
          flex: 1;
        }

        .send-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .send-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        /* メンバータブ */
        .members-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
        }

        .member-avatar {
          width: 44px;
          height: 44px;
        }

        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .member-name {
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .role-badge {
          font-size: 0.65rem;
          padding: 0.15rem 0.4rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border-radius: 4px;
        }

        .member-id {
          font-size: 0.8rem;
          color: #64748b;
        }

        .remove-member-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .remove-member-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .invite-section {
          padding-top: 1.5rem;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
        }

        .invite-section h3 {
          margin: 0 0 1rem;
          font-size: 1rem;
        }

        .invite-code-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(99, 102, 241, 0.05);
          border-radius: 12px;
        }

        .invite-code-box code {
          flex: 1;
          font-size: 1.1rem;
          font-weight: 600;
          color: #6366f1;
          letter-spacing: 0.1em;
        }

        .invite-code-box button {
          padding: 0.5rem 0.75rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        /* モーダル */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 400px;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.05);
          cursor: pointer;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-body label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .input-with-prefix {
          display: flex;
          align-items: center;
        }

        .prefix {
          padding: 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-right: none;
          border-radius: 12px 0 0 12px;
          color: #6366f1;
          font-weight: 600;
        }

        .input-with-prefix input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 0 12px 12px 0;
          font-size: 0.95rem;
          font-family: inherit;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 0.75rem 1.25rem;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }

        .submit-btn {
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .input {
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 14px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.25s ease;
          color: #1e293b;
        }

        .input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .error-page {
          text-align: center;
          padding: 4rem 2rem;
        }

        .back-link {
          color: #6366f1;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }

          .tabs {
            justify-content: flex-start;
          }

          .chat-message {
            max-width: 90%;
          }

          .rankings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
