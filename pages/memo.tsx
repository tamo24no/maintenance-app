import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

export default function MemoPage() {
  const [memo, setMemo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [upcomingMemos, setUpcomingMemos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchMemos = async () => {
      const snap = await getDocs(collection(db, 'memos'));
      const now = new Date().getTime();
      const filtered = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => new Date(d.endDate).getTime() >= now);
      setUpcomingMemos(filtered);
    };
    fetchMemos();
  }, []);

  const handleSave = async () => {
    if (!startDate || !endDate || !memo.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    const id = `${startDate}_${endDate}`;
    await setDoc(doc(db, 'memos', id), {
      memo,
      startDate,
      endDate,
    });

    alert('メモを保存しました');
    router.push('/menu');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このメモを削除しますか？')) return;
    await deleteDoc(doc(db, 'memos', id));
    setUpcomingMemos(upcomingMemos.filter((m) => m.id !== id));
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>📝 メモ記入</h1>

      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="メモを記入..."
        style={{ width: '100%', height: '160px', fontSize: '16px', padding: '12px', marginTop: '20px' }}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
        <div>
          <label>開始日：</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>終了日：</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        <button
          onClick={() => router.push('/menu')}
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            backgroundColor: '#888',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          戻る
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            backgroundColor: '#145E75',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          保存
        </button>
      </div>

      <h2 style={{ marginTop: '40px', fontSize: '20px' }}>🗂 表示予定のメモ一覧</h2>
      {upcomingMemos.length === 0 && <p>表示予定のメモはありません。</p>}
      <ul>
        {upcomingMemos.map((m) => (
          <li key={m.id} style={{ marginTop: '10px', background: '#EAF3F9', padding: '12px', borderRadius: '8px', position: 'relative' }}>
            <div><strong>期間:</strong> {m.startDate} ～ {m.endDate}</div>
            <div><strong>内容:</strong> {m.memo}</div>
            <button
              onClick={() => handleDelete(m.id)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={20} color="#d00" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
