// pages/maintenance-settings/index.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function MaintenanceSettings() {
  const router = useRouter();
  const [date, setDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const formatted = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    setDate(formatted);
  }, []);

  const sectionStyle: React.CSSProperties = {
    padding: '40px',
    fontFamily: 'sans-serif',
    backgroundColor: '#F2F7FA'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '20px'
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    margin: '6px 0',
    backgroundColor: '#145E75',
    color: 'white',
    fontSize: '20px',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px dotted #045D75'
  };

  const maintenancePages = [
    { label: '毎日メンテナンス', path: '/maintenance-settings/daily' },
    { label: '週一メンテナンス', path: '/maintenance-settings/weekly' },
    { label: '月一メンテナンス', path: '/maintenance-settings/monthly' },
    { label: '四半期メンテナンス', path: '/maintenance-settings/quarterly' },
    { label: '年一メンテナンス', path: '/maintenance-settings/yearly' },
  ];

  return (
    <div style={sectionStyle}>
      <h1 style={titleStyle}>各メンテナンス設定</h1>
      <div style={{ maxWidth: '500px' }}>
        {maintenancePages.map(({ label, path }) => (
          <button
            key={path}
            style={buttonStyle}
            onClick={() => router.push(path)}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '40px' }}>
        <button
          style={{
            padding: '12px 28px',
            backgroundColor: '#145E75',
            color: 'white',
            border: '4px solid #063645',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/menu')}
        >
          戻る
        </button>
      </div>
    </div>
  );
}
