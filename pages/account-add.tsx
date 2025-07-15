import { useState } from 'react';

export default function AccountAdd() {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !employeeId || !email) {
      alert('すべての項目を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sendPasswordSetupEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          employeeId,
          email
        })
      });

      if (res.ok) {
        alert('メールを送信しました');
      } else {
        const errorText = await res.text();
        console.error('送信エラー:', errorText);
        alert('送信に失敗しました');
      }
    } catch (err) {
      console.error('送信時の例外:', err);
      alert('送信時にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📨 アカウント追加</h2>

      <label>氏名：</label><br />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      /><br /><br />

      <label>社員番号（ログインID）：</label><br />
      <input
        type="text"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      /><br /><br />

      <label>メールアドレス：</label><br />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br /><br />

      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : 'メール送信・認証'}
      </button>
    </div>
  );
}
