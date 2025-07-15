//pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('');

    if (!employeeId || !password) {
      setError('社員番号とパスワードを入力してください。');
      return;
    }

    try {
      const response = await fetch('/api/loginUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('ログイン成功！');
        router.push('/menu'); // ログイン後に遷移するページ
      } else {
        setError(data.message || 'ログインに失敗しました。');
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('ログイン中にエラーが発生しました。');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>ログイン</h2>

      <label>ログインID（社員番号）：</label>
      <input
        type="text"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
      />

      <label>パスワード：</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={handleLogin}>ログイン</button>

      <p>アカウントをお持ちでない方は、<a href="/account-add">新規登録</a></p>
    </div>
  );
}
