'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGroups } from '@/features/group/hooks/useGroups';
import { useCategories } from '@/features/category/hooks/useCategories';
import { GROUP_TEMPLATES, GroupTemplate } from '@/features/group/types';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';

export default function GroupsPage() {
  const { groups, isLoading, error, createGroup, joinGroup, refetch } = useGroups();
  const { categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GroupTemplate | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', sharedCategories: [] as string[] });
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreate = async () => {
    if (!newGroup.name.trim()) {
      showMessage('error', 'グループ名を入力してください');
      return;
    }
    if (newGroup.sharedCategories.length === 0) {
      showMessage('error', '共有するカテゴリを選択してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup(newGroup);
      showMessage('success', 'グループを作成しました');
      setNewGroup({ name: '', description: '', sharedCategories: [] });
      setSelectedTemplate(null);
      setShowCreateForm(false);
      // グループ一覧を再取得（念のため）
      await refetch();
    } catch (err: any) {
      showMessage('error', err.message || 'グループの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      showMessage('error', '招待コードを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await joinGroup(inviteCode.trim());
      showMessage('success', 'グループに参加しました');
      setInviteCode('');
      setShowJoinForm(false);
    } catch (err: any) {
      showMessage('error', err.message || '参加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setNewGroup((prev) => ({
      ...prev,
      sharedCategories: prev.sharedCategories.includes(categoryName)
        ? prev.sharedCategories.filter((c) => c !== categoryName)
        : [...prev.sharedCategories, categoryName],
    }));
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="groups-page">
      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="page-header">
        <div className="header-content">
          <h1>
            <span className="title-icon">👥</span>
            グループ
          </h1>
          <p className="subtitle">仲間と活動を共有して、一緒に成長しましょう</p>
        </div>
        <div className="header-actions">
          <button className="action-btn join-btn" onClick={() => setShowJoinForm(true)}>
            🔗 参加する
          </button>
          <button className="action-btn create-btn" onClick={() => {
            setNewGroup({
              name: '',
              description: '',
              sharedCategories: [],
            });
            setSelectedTemplate(null);
            setShowCreateForm(true);
          }}>
            ➕ 新規作成
          </button>
        </div>
      </div>

      {/* グループ作成フォーム */}
      {showCreateForm && (
        <div className="form-card">
          <div className="form-header">
            <h2>✨ 新しいグループを作成</h2>
            <button className="close-btn" onClick={() => setShowCreateForm(false)}>✕</button>
          </div>

          {/* テンプレート選択 */}
          <div className="form-field">
            <label>テンプレートを選択（オプション）</label>
            <div className="template-grid">
              {GROUP_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-btn ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    // テンプレートのカテゴリを自動設定（ユーザーのカテゴリに存在するもののみ）
                    const availableCategories = template.defaultCategories.filter(catName =>
                      categories.some(cat => cat.name === catName)
                    );
                    setNewGroup({
                      name: template.id === 'custom' ? '' : template.name,
                      description: template.defaultDescription || '',
                      sharedCategories: availableCategories,
                    });
                  }}
                >
                  <span className="template-emoji">{template.emoji}</span>
                  <span className="template-name">{template.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-field">
            <label>グループ名</label>
            <input
              type="text"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              placeholder="例: チーム開発メンバー"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label>説明（任意）</label>
            <textarea
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              placeholder="グループの説明を入力..."
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label>共有するカテゴリ</label>
            <p className="form-hint">メンバーがこれらのカテゴリの活動をグループに共有できます。</p>
            {categoriesLoading ? (
              <p>カテゴリを読み込み中...</p>
            ) : (
              <>
                <div className="category-select">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-btn ${newGroup.sharedCategories.includes(cat.name) ? 'selected' : ''}`}
                      onClick={() => toggleCategory(cat.name)}
                      style={{ '--cat-color': cat.color } as React.CSSProperties}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                  <Link href="/settings/categories" className="customize-btn">
                    ⚙️ カスタマイズ
                  </Link>
                </div>
                <div className="add-category-input" style={{ marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="新しいカテゴリ名を入力（Enterで追加）"
                    className="form-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const categoryName = input.value.trim();
                        if (categoryName && !newGroup.sharedCategories.includes(categoryName)) {
                          setNewGroup((prev) => ({
                            ...prev,
                            sharedCategories: [...prev.sharedCategories, categoryName],
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowCreateForm(false)}>キャンセル</button>
            <button className="submit-btn" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? '作成中...' : 'グループを作成'}
            </button>
          </div>
        </div>
      )}

      {/* グループ参加フォーム */}
      {showJoinForm && (
        <div className="form-card">
          <div className="form-header">
            <h2>🔗 グループに参加</h2>
            <button className="close-btn" onClick={() => setShowJoinForm(false)}>✕</button>
          </div>
          
          <div className="form-field">
            <label>招待コード</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="招待コードを入力"
              className="form-input"
            />
            <p className="form-hint">グループのオーナーから共有された招待コードを入力してください</p>
          </div>

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowJoinForm(false)}>キャンセル</button>
            <button className="submit-btn" onClick={handleJoin} disabled={isSubmitting}>
              {isSubmitting ? '参加中...' : '参加する'}
            </button>
          </div>
        </div>
      )}

      {/* グループ一覧 */}
      {error ? (
        <div className="alert alert-error">⚠️ {error}</div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="グループがありません"
          description="グループを作成するか、招待コードで参加しましょう"
        />
      ) : (
        <div className="groups-grid">
          {groups.filter((g) => g && g.id).map((group) => (
            <Link href={`/groups/${group.id}`} key={group.id} className="group-card">
              <div className="group-header">
                <h3>{group.name}</h3>
                {group.owner?.id === group.members?.find((m) => m.role === 'owner')?.user?.id && (
                  <span className="owner-badge">オーナー</span>
                )}
              </div>
              {group.description && (
                <p className="group-description">{group.description}</p>
              )}
              <div className="group-stats">
                <span className="stat">
                  <span className="stat-icon">👥</span>
                  {group.memberCount}人
                </span>
                <span className="stat">
                  <span className="stat-icon">📝</span>
                  {group.activityCount}件の活動
                </span>
              </div>
              <div className="shared-categories">
                {group.sharedCategories.slice(0, 3).map((cat) => {
                  const catInfo = categories.find((c) => c.name === cat);
                  return (
                    <span key={cat} className="mini-chip">
                      {catInfo?.emoji || '📦'} {cat}
                    </span>
                  );
                })}
                {group.sharedCategories.length > 3 && (
                  <span className="mini-chip more">+{group.sharedCategories.length - 3}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .groups-page {
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
          animation: slideIn 0.3s ease;
        }

        .toast.success { border-left: 4px solid #10b981; }
        .toast.error { border-left: 4px solid #ef4444; }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .header-content h1 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .title-icon {
          font-size: 1.75rem;
          -webkit-text-fill-color: initial;
        }

        .subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .join-btn {
          background: rgba(255, 255, 255, 0.7);
          color: #6366f1;
          border: 2px solid rgba(99, 102, 241, 0.2);
        }

        .join-btn:hover {
          background: white;
          border-color: #6366f1;
        }

        .create-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        .form-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .form-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.05);
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .form-field {
          margin-bottom: 1.25rem;
        }

        .form-field label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-hint {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0.5rem 0;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .template-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .template-btn:hover {
          border-color: #6366f1;
          background: white;
          transform: translateY(-2px);
        }
        .template-btn.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
        .template-emoji {
          font-size: 2rem;
        }
        .template-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
        }
        .category-select {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .category-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .category-btn:hover {
          background: white;
        }

        .category-btn.selected {
          border-color: var(--cat-color, #6366f1);
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .customize-btn {
          padding: 0.5rem 1rem;
          background: rgba(99, 102, 241, 0.1);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          font-size: 0.85rem;
          color: #6366f1;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .customize-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: #6366f1;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .cancel-btn {
          padding: 0.75rem 1.25rem;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          font-family: inherit;
        }

        .submit-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }

        .group-card {
          display: block;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 3px solid rgba(0, 0, 0, 0.25);
          border-radius: 24px;
          padding: 1.5rem;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.15),
            0 8px 24px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            0 0 0 1px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .group-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          pointer-events: none;
          border-radius: 21px;
          margin: 3px;
        }

        .group-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          pointer-events: none;
          margin-top: 3px;
        }

        .group-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(0, 0, 0, 0.35);
          box-shadow: 
            0 24px 72px rgba(0, 0, 0, 0.18),
            0 12px 32px rgba(0, 0, 0, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(255, 255, 255, 0.15);
        }

        .group-card:active {
          transform: translateY(-2px);
        }

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          position: relative;
          z-index: 1;
        }

        .group-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .owner-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border-radius: 6px;
          font-weight: 600;
        }

        .group-description {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0.5rem 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .group-stats {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
          position: relative;
          z-index: 1;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: #64748b;
        }

        .stat-icon {
          font-size: 1rem;
        }

        .shared-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          position: relative;
          z-index: 1;
        }

        .mini-chip {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border-radius: 6px;
        }

        .mini-chip.more {
          background: rgba(0, 0, 0, 0.05);
          color: #64748b;
        }

        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            justify-content: stretch;
          }

          .action-btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

