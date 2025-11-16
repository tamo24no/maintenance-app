// pages/other-settings.tsx
import type React from 'react';
import { useRouter } from 'next/router';

const OtherSettings: React.FC = () => {
  const router = useRouter();

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '20px',
    margin: '10px 0',
    backgroundColor: '#145E75',
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '2px',
    textAlign: 'left',
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#F2F7FA', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '30px' }}>その他設定</h1>

      <button
        style={buttonStyle}
        onClick={() => router.push('/account-add')}
      >
        アカウントの追加
      </button>

      <button
        style={buttonStyle}
        onClick={() => router.push('/account-delete')}
      >
        アカウントの削除
      </button>

      <button
        style={buttonStyle}
        onClick={() => router.push('/account-list')}
      >
        アカウント一覧
      </button>

      {/* ★ ここが今回追加するボタン */}
      <button
        style={buttonStyle}
        onClick={() => router.push('/password-change')}
      >
        パスワード変更
      </button>

      <button
        style={{ ...buttonStyle, backgroundColor: '#145E75', color: 'white' }}
        onClick={() => router.push('/office-settings')}
      >
        所属箇所の設定
      </button>

    </div>
  );
};

export default OtherSettings;
