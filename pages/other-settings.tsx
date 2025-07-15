//pages/other-settings.tsx
import { useRouter } from 'next/router';

export default function OtherSettings() {
  const router = useRouter();

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '20px',
    margin: '10px 0',
    backgroundColor: '#1A6583',
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#F2F7FA', height: '100vh' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '30px' }}>その他設定</h1>

      <button style={buttonStyle} onClick={() => alert('アカウント追加ページに遷移予定')}>
        アカウントの追加
      </button>
      <button style={buttonStyle} onClick={() => alert('アカウント削除ページに遷移予定')}>
        アカウントの削除
      </button>
      <button style={buttonStyle} onClick={() => alert('アカウント一覧ページに遷移予定')}>
        アカウント一覧
      </button>
    </div>
  );
}
