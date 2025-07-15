//pages/password-setup.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PasswordSetup() {
  const router = useRouter();
  const { name, employeeId, email } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URLクエリが読み込まれたかどうかを確認
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (name && employeeId && email) {
      setLoaded(true);
    }
  }, [name, employeeId, email]);

  const handleRegister = async () => {
    if (!password || !confirmPassword) {
      alert('すべての項目を入力してください');
      return;
    }
    if (password !== confirmPassword) {
      alert('パスワードが一致しません');
      return;
    }
    if (password.length < 7) {
      alert('パスワードは7文字以上にしてください');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/registerUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          employeeId,
          email,
          password
        })
      });

      if (res.ok) {
        alert('登録が完了しました');
        router.push('/login');
      } else {
        const errorText = await res.text();
        console.error('登録失敗:', errorText);
        alert('登録に失敗しました');
      }
    } catch (err) {
      console.error('登録時のエラー:', err);
      alert('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loaded) {
    return <p>読み込み中...</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔐 メンテナンスパスワード設定画面</h2>
      <p>{name} さん、ようこそ！パスワードを設定してください。</p>

      <label>パスワード：</label><br />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />

      <label>パスワード（確認用）：</label><br />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      /><br /><br />

      <button onClick={handleRegister} disabled={isSubmitting}>
        {isSubmitting ? '登録中...' : '登録'}
      </button>
    </div>
  );
}
