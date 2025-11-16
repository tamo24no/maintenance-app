// pages/daily-settings.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];
const officeList = ['宮崎工務所', '南延岡工務室', 'ALL'];

const DailySettings = () => {
  const router = useRouter();

  const [tasks, setTasks] = useState<any[]>([]);
  const [item, setItem] = useState('');
  const [place, setPlace] = useState('');
  const [day, setDay] = useState('未選択');
  const [visible, setVisible] = useState(true);
  const [office, setOffice] = useState('宮崎工務所'); // ← 所属箇所

  const [editingId, setEditingId] = useState<string | null>(null);

  // --------------------------------------------
  // 設定一覧取得
  // --------------------------------------------
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'dailySettings'));
      setTasks(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    };
    load();
  }, []);

  // --------------------------------------------
  // 保存（新規 or 更新）
  // --------------------------------------------
  const handleSave = async () => {
    if (!item || !place) {
      alert('項目名・場所は入力必須です');
      return;
    }

    const id = editingId || crypto.randomUUID(); // 新規時はUUID生成
    const ref = doc(db, 'dailySettings', id);

    await setDoc(ref, {
      item,
      place,
      day,
      visible,
      office, // ★所属箇所を保存
    });

    alert(editingId ? '更新しました' : '追加しました');
    router.reload();
  };

  // --------------------------------------------
  // 編集モードへ
  // --------------------------------------------
  const startEdit = (task: any) => {
    setEditingId(task.id);
    setItem(task.item);
    setPlace(task.place);
    setDay(task.day);
    setVisible(task.visible);
    setOffice(task.office || '宮崎工務所');
  };

  // --------------------------------------------
  // 削除
  // --------------------------------------------
  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'dailySettings', id));
    alert('削除しました');
    router.reload();
  };

  // --------------------------------------------
  // UI
  // --------------------------------------------
  const inputStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '12px',
    fontSize: '16px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    marginRight: '12px',
    backgroundColor: '#145E75',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Daily メンテナンス設定</h1>

      {/* ------------------ 入力フォーム ------------------ */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#F2F7FA', borderRadius: '12px' }}>
        
        <label>項目名</label>
        <input
          style={inputStyle}
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />

        <label>場所</label>
        <input
          style={inputStyle}
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />

        <label>推奨曜日</label>
        <select style={inputStyle} value={day} onChange={(e) => setDay(e.target.value)}>
          {days.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <label>所属箇所（表示対象）</label>
        <select style={inputStyle} value={office} onChange={(e) => setOffice(e.target.value)}>
          {officeList.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          表示する
        </label>

        <div style={{ marginTop: '20px' }}>
          <button style={buttonStyle} onClick={handleSave}>
            {editingId ? '更新' : '追加'}
          </button>
          <button
            style={{ ...buttonStyle, backgroundColor: '#888' }}
            onClick={() => router.push('/menu')}
          >
            戻る
          </button>
        </div>
      </div>

      {/* ------------------ 一覧表示 ------------------ */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#E0EEF3' }}>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>項目名</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>場所</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>推奨日</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>所属箇所</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>編集</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>削除</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, i) => (
            <tr key={task.id} style={{ background: i % 2 === 0 ? '#F7FBFF' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{task.item}</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{task.place}</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{task.day}</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{task.office}</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                <button onClick={() => startEdit(task)}>編集</button>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                <button onClick={() => handleDelete(task.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailySettings;
