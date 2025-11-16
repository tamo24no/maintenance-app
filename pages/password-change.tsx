// pages/password-change.tsx
import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { hashPassword } from '../lib/hashPassword';

const PasswordChangePage: React.FC = () => {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ログイン中ユーザー情報を localStorage から取得
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('maintenanceAppUser');
    if (!stored) {
      // 未ログインならログイン画面へ
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(stored);
      if (user?.employeeId) {
        setEmployeeId(user.employeeId);
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setError(null);

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setError('すべての項目を入力してください。');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('新しいパスワードが一致しません。');
      return;
    }

    if (newPassword.length < 6) {
      setError('パスワードは6文字以上にしてください。');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', employeeId);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setError('ユーザー情報が見つかりません。');
        setLoading(false);
        return;
      }

      const data = snap.data();

      // Firestore に保存されているパスワード（ハッシュ）
      const storedHash = data.password as string | undefined;
      if (!storedHash) {
        setError('ユーザー情報にパスワードが登録されていません。');
        setLoading(false);
        return;
      }

      // 入力された「現在のパスワード」をハッシュ化して照合
      const currentHash = await hashPassword(currentPassword);
      if (storedHash !== currentHash) {
        setError('現在のパスワードが正しくありません。');
        setLoading(false);
        return;
      }

      // 新しいパスワードをハッシュ化して保存
      const newHash = await hashPassword(newPassword);
      await updateDoc(userRef, { password: newHash });

      alert('パスワードを変更しました。次回から新しいパスワードでログインしてください。');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      router.push('/menu');
    } catch (err) {
      console.error(err);
      setError('パスワード変更に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // ユーザー情報読み込み中の簡易表示
  if (employeeId === null) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
        ユーザー情報を読み込み中です...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'sans-serif',
        backgroundColor: '#F2F7FA',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>パスワード変更</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            現在のパスワード
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            新しいパスワード
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            新しいパスワード（確認）
          </label>
          <input
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => router.push('/other-settings')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#888',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            戻る
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#145E75',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '変更中...' : 'パスワードを変更'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangePage;
