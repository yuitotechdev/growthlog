'use client';

import { useState, useEffect, useRef } from 'react';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { Loading } from '@/components/ui/Loading';
import Link from 'next/link';

export default function ProfileSettingsPage() {
  const { profile, isLoading, updateProfile, updateUniqueId, checkUniqueIdAvailability } = useProfile();
  const [username, setUsername] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [uniqueIdStatus, setUniqueIdStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [isSavingEmoji, setIsSavingEmoji] = useState(false);
  const emojiGridRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setUniqueId(profile.uniqueId || '');
      setSelectedEmoji(profile.avatarEmoji || '');
    }
  }, [profile]);

  // スクロール可能状態を初期化
  useEffect(() => {
    const checkScroll = () => {
      if (emojiGridRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = emojiGridRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };
    
    checkScroll();
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [profile]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCheckUniqueId = async () => {
    if (!uniqueId || uniqueId.length < 3) return;
    const result = await checkUniqueIdAvailability(uniqueId);
    setUniqueIdStatus(result);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ username: username || undefined });
      showMessage('success', 'プロフィールを更新しました');
    } catch (err: any) {
      showMessage('error', err.message || '更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUniqueId = async () => {
    if (!uniqueId || uniqueId === profile?.uniqueId) return;
    
    setIsSaving(true);
    try {
      await updateUniqueId(uniqueId);
      showMessage('success', 'ユーザーIDを更新しました');
      setUniqueIdStatus(null);
    } catch (err: any) {
      showMessage('error', err.message || '更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // イニシャルを取得
  const getInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  // 絵文字を保存
  const handleSaveEmoji = async () => {
    setIsSavingEmoji(true);
    try {
      await updateProfile({ avatarEmoji: selectedEmoji || null });
      showMessage('success', 'プロフィール絵文字を更新しました');
    } catch (err: any) {
      showMessage('error', err.message || '絵文字の更新に失敗しました');
    } finally {
      setIsSavingEmoji(false);
    }
  };

  // 絵文字を削除
  const handleRemoveEmoji = async () => {
    setIsSavingEmoji(true);
    try {
      await updateProfile({ avatarEmoji: null });
      setSelectedEmoji('');
      showMessage('success', 'プロフィール絵文字を削除しました');
    } catch (err: any) {
      showMessage('error', err.message || '絵文字の削除に失敗しました');
    } finally {
      setIsSavingEmoji(false);
    }
  };

  // 利用可能な絵文字リスト
  const availableEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎',
    '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
    '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
    '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
    '🎨', '🎭', '🎬', '🎤', '🎧', '🎹', '🥁', '🎷', '🎺', '🎸',
    '🎻', '🎲', '🎯', '🎳', '🎮', '🎰', '🚀', '✈️', '🛸', '🚁',
    '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪',
    '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻',
    '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️',
    '🏚️', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️',
    '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇',
    '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄',
    '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌',
    '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗',
    '🚘', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🚲', '🛴',
    '🛹', '🛼', '🚁', '🛸', '✈️', '🛫', '🛬', '🪂', '💺', '🚀',
    '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥',
    '🗽', '🏁', '🚏', '🎯', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧',
    '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '🎯', '🎳', '🎮',
    '🎰', '🧩', '♟️', '🎯', '🎲', '🎳', '🎮', '🎰', '🧩', '♟️',
  ];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="profile-page">
      {message && (
        <div className={`toast ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="page-header">
        <div className="breadcrumb">
          <Link href="/">ホーム</Link>
          <span className="separator">›</span>
          <span>プロフィール設定</span>
        </div>
        <h1>
          <span className="title-icon">👤</span>
          プロフィール設定
        </h1>
      </div>

      <div className="content-card">
        {/* アバターセクション */}
        <div className="avatar-section">
          <div className="avatar-preview">
            {selectedEmoji ? (
              <div className="avatar-emoji">{selectedEmoji}</div>
            ) : (
              <div className="avatar-placeholder">{getInitials()}</div>
            )}
          </div>
          <div className="avatar-info">
            <h3>プロフィール絵文字</h3>
            <div className="emoji-selector">
              <button
                className="emoji-scroll-btn emoji-scroll-left"
                onClick={() => {
                  if (emojiGridRef.current) {
                    emojiGridRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                  }
                }}
                disabled={!canScrollLeft}
                type="button"
                aria-label="左にスクロール"
              >
                ‹
              </button>
              <div 
                className="emoji-grid-wrapper"
                ref={emojiGridRef}
                onScroll={() => {
                  if (emojiGridRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = emojiGridRef.current;
                    setCanScrollLeft(scrollLeft > 0);
                    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
                  }
                }}
              >
                <div className="emoji-grid">
                  {availableEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setSelectedEmoji(emoji)}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="emoji-scroll-btn emoji-scroll-right"
                onClick={() => {
                  if (emojiGridRef.current) {
                    emojiGridRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                  }
                }}
                disabled={!canScrollRight}
                type="button"
                aria-label="右にスクロール"
              >
                ›
              </button>
            </div>
            <div className="avatar-actions">
              <button
                className="avatar-save-btn"
                onClick={handleSaveEmoji}
                disabled={isSavingEmoji || selectedEmoji === (profile?.avatarEmoji || '')}
              >
                {isSavingEmoji ? '保存中...' : '保存'}
              </button>
              {selectedEmoji && (
                <button
                  className="avatar-remove-btn"
                  onClick={handleRemoveEmoji}
                  disabled={isSavingEmoji}
                >
                  🗑️ 削除
                </button>
              )}
            </div>
            <p className="avatar-hint">絵文字を選択してプロフィールアイコンを設定できます</p>
          </div>
        </div>

        {/* 表示名セクション */}
        <div className="form-section">
          <label className="form-label">表示名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            placeholder="表示名を入力"
            maxLength={50}
          />
          <p className="form-hint">他のユーザーに表示される名前です</p>
          <button 
            className="save-btn" 
            onClick={handleSaveProfile}
            disabled={isSaving || username === (profile?.username || '')}
          >
            {isSaving ? '保存中...' : '表示名を保存'}
          </button>
        </div>

        {/* ユーザーIDセクション */}
        <div className="form-section">
          <label className="form-label">
            ユーザーID
            {!profile?.canChangeUniqueId && (
              <span className="label-badge">変更制限中</span>
            )}
          </label>
          <div className="unique-id-input">
            <span className="prefix">@</span>
            <input
              type="text"
              value={uniqueId}
              onChange={(e) => {
                setUniqueId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                setUniqueIdStatus(null);
              }}
              onBlur={handleCheckUniqueId}
              className="form-input"
              placeholder="user123"
              maxLength={20}
              disabled={!profile?.canChangeUniqueId}
            />
          </div>
          {uniqueIdStatus && (
            <p className={`form-hint ${uniqueIdStatus.available ? 'success' : 'error'}`}>
              {uniqueIdStatus.message}
            </p>
          )}
          <p className="form-hint">
            3〜20文字の英数字とアンダースコア（_）が使用できます。
            {!profile?.canChangeUniqueId && '変更は1ヶ月に1回のみ可能です。'}
          </p>
          <button 
            className="save-btn" 
            onClick={handleSaveUniqueId}
            disabled={
              isSaving || 
              !profile?.canChangeUniqueId || 
              uniqueId === profile?.uniqueId ||
              !uniqueId ||
              uniqueId.length < 3 ||
              (uniqueIdStatus && !uniqueIdStatus.available)
            }
          >
            {isSaving ? '保存中...' : 'ユーザーIDを保存'}
          </button>
        </div>

        {/* メールアドレス（読み取り専用） */}
        <div className="form-section readonly">
          <label className="form-label">メールアドレス</label>
          <input
            type="email"
            value={profile?.email || ''}
            className="form-input"
            disabled
          />
          <p className="form-hint">メールアドレスは変更できません</p>
        </div>
      </div>

      <style jsx>{`
        .profile-page {
          max-width: 600px;
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
          animation: slideIn 0.3s ease;
        }

        .toast.success { border-left: 4px solid #10b981; }
        .toast.error { border-left: 4px solid #ef4444; }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 1rem;
        }

        .breadcrumb a {
          color: #6366f1;
          text-decoration: none;
        }

        .breadcrumb a:hover { color: #4f46e5; }

        .separator { color: #cbd5e1; }

        .page-header h1 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .title-icon {
          font-size: 1.75rem;
          -webkit-text-fill-color: initial;
        }

        .content-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
          max-width: 100%;
          overflow-x: hidden;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          margin-bottom: 2rem;
        }

        .avatar-preview {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar-emoji {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .avatar-info {
          flex: 1;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }

        .avatar-info h3 {
          margin: 0 0 0.25rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .avatar-hint {
          margin: 0.5rem 0 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .avatar-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
          flex-wrap: wrap;
        }


        .avatar-save-btn {
          padding: 0.625rem 1.25rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .avatar-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .avatar-save-btn:disabled {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
          cursor: not-allowed;
        }

        .avatar-remove-btn {
          padding: 0.625rem 1.25rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .avatar-remove-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .avatar-remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .emoji-selector {
          margin-top: 1rem;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          max-width: 100%;
          width: 100%;
        }

        .emoji-grid-wrapper {
          flex: 1;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          max-width: 100%;
          white-space: nowrap;
        }

        .emoji-grid-wrapper::-webkit-scrollbar {
          height: 4px;
        }

        .emoji-grid-wrapper::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }

        .emoji-grid-wrapper::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 2px;
        }

        .emoji-grid-wrapper::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }

        /* スクロールバーを自動で表示/非表示 */
        .emoji-grid-wrapper:not(:hover)::-webkit-scrollbar-thumb {
          background: transparent;
        }

        .emoji-grid {
          display: inline-flex;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          min-height: 100px;
          max-height: 120px;
          align-items: center;
          white-space: nowrap;
          width: max-content;
        }

        .emoji-option {
          min-width: 60px;
          width: 60px;
          height: 60px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          font-size: 2.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .emoji-option:hover {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.5);
          transform: scale(1.1);
        }

        .emoji-option.selected {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-color: #6366f1;
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .emoji-scroll-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 50%;
          font-size: 1.5rem;
          font-weight: 700;
          color: #6366f1;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .emoji-scroll-btn:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.5);
          transform: scale(1.1);
        }

        .emoji-scroll-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .emoji-scroll-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section.readonly {
          opacity: 0.7;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }

        .label-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 6px;
          font-weight: 500;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          font-size: 1rem;
          font-family: inherit;
          color: #1e293b;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-input:disabled {
          background: rgba(0, 0, 0, 0.05);
          cursor: not-allowed;
        }

        .unique-id-input {
          display: flex;
          align-items: center;
        }

        .prefix {
          padding: 0.875rem 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-right: none;
          border-radius: 12px 0 0 12px;
          font-size: 1rem;
          color: #6366f1;
          font-weight: 600;
        }

        .unique-id-input .form-input {
          border-radius: 0 12px 12px 0;
        }

        .form-hint {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
        }

        .form-hint.success { color: #10b981; }
        .form-hint.error { color: #ef4444; }

        .save-btn {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .save-btn:disabled {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}


