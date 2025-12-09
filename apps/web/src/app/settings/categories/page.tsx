'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ApiClient } from '@growthlog/shared';
import { Loading } from '@/components/ui/Loading';
import { Toast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
}

const EMOJI_OPTIONS = ['📚', '💼', '🏃', '🏠', '🎮', '🎨', '🎵', '📝', '💡', '🔧', '📦', '🌟', '❤️', '🎯', '🚀'];
const COLOR_OPTIONS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#64748b'];

export default function CategoriesSettingsPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // 新規カテゴリ用
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📦');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [isAdding, setIsAdding] = useState(false);
  
  // 編集用
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');

  const fetchCategories = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      const data = await client.get<Category[]>('/api/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!token || !newName.trim()) {
      setToast({ message: 'カテゴリ名を入力してください', type: 'error' });
      return;
    }

    try {
      setIsAdding(true);
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      await client.post('/api/categories', {
        name: newName.trim(),
        emoji: newEmoji,
        color: newColor,
      });
      setToast({ message: 'カテゴリを追加しました', type: 'success' });
      setNewName('');
      setNewEmoji('📦');
      setNewColor('#3b82f6');
      fetchCategories();
    } catch (err: any) {
      setToast({ message: err.message || '追加に失敗しました', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditEmoji(category.emoji);
    setEditColor(category.color);
  };

  const handleSaveEdit = async () => {
    if (!token || !editingId || !editName.trim()) return;

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      await client.put(`/api/categories/${editingId}`, {
        name: editName.trim(),
        emoji: editEmoji,
        color: editColor,
      });
      setToast({ message: 'カテゴリを更新しました', type: 'success' });
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      setToast({ message: err.message || '更新に失敗しました', type: 'error' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    if (!token) return;

    try {
      const client = new ApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => token,
      });
      await client.delete(`/api/categories/${id}`);
      setToast({ message: 'カテゴリを削除しました', type: 'success' });
      fetchCategories();
    } catch (err: any) {
      setToast({ message: err.message || '削除に失敗しました', type: 'error' });
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="categories-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="breadcrumb">
        <Link href="/">ホーム</Link>
        <span className="separator">›</span>
        <span>カテゴリ設定</span>
      </div>

      <div className="page-header">
        <h1>🏷️ カテゴリ設定</h1>
        <p className="subtitle">活動のカテゴリを自由にカスタマイズできます</p>
      </div>

      {/* 新規追加フォーム */}
      <div className="add-form card">
        <h2>➕ 新しいカテゴリを追加</h2>
        <div className="form-row">
          <div className="form-group">
            <label>絵文字</label>
            <div className="emoji-selector">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  className={`emoji-btn ${newEmoji === emoji ? 'selected' : ''}`}
                  onClick={() => setNewEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>カラー</label>
            <div className="color-selector">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  className={`color-btn ${newColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setNewColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group flex-grow">
            <label>カテゴリ名</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: 読書"
              className="input"
            />
          </div>
          <button
            className="add-btn"
            onClick={handleAddCategory}
            disabled={isAdding || !newName.trim()}
          >
            {isAdding ? '追加中...' : '追加'}
          </button>
        </div>
        <div className="preview">
          プレビュー: <span className="category-badge" style={{ background: newColor }}>{newEmoji} {newName || 'カテゴリ名'}</span>
        </div>
      </div>

      {/* カテゴリ一覧 */}
      <div className="categories-list card">
        <h2>📋 カテゴリ一覧</h2>
        {categories.length === 0 ? (
          <p className="no-data">カテゴリがありません</p>
        ) : (
          <div className="list">
            {categories.map((category) => (
              <div key={category.id} className="category-item">
                {editingId === category.id ? (
                  <div className="edit-form">
                    <div className="edit-row">
                      <div className="emoji-selector small">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            className={`emoji-btn ${editEmoji === emoji ? 'selected' : ''}`}
                            onClick={() => setEditEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="color-selector small">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            className={`color-btn ${editColor === color ? 'selected' : ''}`}
                            style={{ background: color }}
                            onClick={() => setEditColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="edit-row">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input"
                      />
                      <button className="save-btn" onClick={handleSaveEdit}>保存</button>
                      <button className="cancel-btn" onClick={() => setEditingId(null)}>キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="category-info">
                      <span className="category-badge" style={{ background: category.color }}>
                        {category.emoji} {category.name}
                      </span>
                      {category.isDefault && <span className="default-badge">デフォルト</span>}
                    </div>
                    <div className="category-actions">
                      <button className="edit-btn" onClick={() => handleStartEdit(category)}>✏️</button>
                      <button className="delete-btn" onClick={() => handleDelete(category.id, category.name)}>🗑️</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .categories-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        .breadcrumb a {
          color: #6366f1;
          text-decoration: none;
        }

        .separator {
          color: #cbd5e1;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #1e293b 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: #64748b;
          margin: 0;
        }

        .card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .card h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem;
          color: #1e293b;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.flex-grow {
          flex: 1;
          min-width: 200px;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }

        .input {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
        }

        .emoji-selector, .color-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .emoji-selector.small, .color-selector.small {
          gap: 0.25rem;
        }

        .emoji-btn {
          width: 36px;
          height: 36px;
          border: 2px solid transparent;
          border-radius: 8px;
          background: rgba(99, 102, 241, 0.05);
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .emoji-btn:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        .emoji-btn.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.15);
        }

        .color-btn {
          width: 28px;
          height: 28px;
          border: 3px solid transparent;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .color-btn:hover {
          transform: scale(1.1);
        }

        .color-btn.selected {
          border-color: #1e293b;
          box-shadow: 0 0 0 2px white;
        }

        .add-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .add-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .add-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .preview {
          font-size: 0.9rem;
          color: #64748b;
        }

        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          color: white;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .default-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border-radius: 4px;
        }

        .category-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: rgba(99, 102, 241, 0.1);
        }

        .delete-btn {
          background: rgba(239, 68, 68, 0.1);
        }

        .edit-btn:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .edit-form {
          width: 100%;
        }

        .edit-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .edit-row .input {
          flex: 1;
          min-width: 150px;
        }

        .save-btn, .cancel-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }

        .save-btn {
          background: #10b981;
          color: white;
        }

        .cancel-btn {
          background: rgba(0, 0, 0, 0.05);
          color: #64748b;
        }

        .no-data {
          text-align: center;
          color: #64748b;
          padding: 2rem;
        }

        @media (max-width: 640px) {
          .categories-page {
            padding: 1.5rem;
          }

          .form-row {
            flex-direction: column;
          }

          .add-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

