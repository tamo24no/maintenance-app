// pages/weekly.tsx
import { useEffect, useState } from 'react';
import type React from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  writeBatch, // ★ 追加
} from 'firebase/firestore';

const Weekly = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>('');
  const [userName, setUserName] = useState<string>(''); // ★ ログインユーザー名
  const router = useRouter();

  const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];

  useEffect(() => {
    // ★ ログインユーザー情報の取得（Daily と同じ）
    const stored =
      typeof window !== 'undefined'
        ? localStorage.getItem('maintenanceAppUser')
        : null;

    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.name) {
          setUserName(user.name);
        } else if (user?.employeeId) {
          setUserName(user.employeeId);
        }
      } catch {
        // 失敗時は何もしない
      }
    }

    const fetchData = async () => {
      const q = query(
        collection(db, 'weeklySettings'),
        where('visible', '==', true)
      );
      const snap = await getDocs(q);
      const tasksWithLogs = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const task = { id: docSnap.id, ...docSnap.data() };
          const logRef = doc(db, 'weeklyChecks', task.id);
          const logSnap = await getDoc(logRef);
          const logData = logSnap.exists() ? logSnap.data() : null;
          return {
            ...task,
            log: logData?.timestamp || '',
            user: logData?.user || '',
          };
        })
      );

      setTasks(tasksWithLogs);

      // ★ 初期チェックはすべて OFF（過去ログは表示のみ）
      setCheckedIds([]);
    };

    fetchData();
  }, []);

  const handleCheck = (taskId: string) => {
    const newCheckedIds = checkedIds.includes(taskId)
      ? checkedIds.filter((id) => id !== taskId)
      : [...checkedIds, taskId];
    setCheckedIds(newCheckedIds);
  };

  const handleUpdate = async () => {
    if (!userName) {
      alert(
        'ユーザー情報が取得できませんでした。ログインし直してください。'
      );
      return;
    }

    const now = new Date().toISOString().split('T')[0];

    // ★ Weekly も Daily と同様に、チェックが付いているものだけ更新
    const batch = writeBatch(db);

    for (const taskId of checkedIds) {
      const logRef = doc(db, 'weeklyChecks', taskId);
      batch.set(
        logRef,
        {
          timestamp: now,
          user: userName,
        },
        { merge: true } // 既存ログがあってもマージして上書き
      );
    }

    await batch.commit();

    alert('更新が完了しました');
    location.reload();
  };

  const handleSort = (key: string) => {
    const sorted = [...tasks].sort((a, b) => {
      if (key === 'day') {
        return (
          days.indexOf(a[key] || '未選択') -
          days.indexOf(b[key] || '未選択')
        );
      }
      return (a[key] || '').localeCompare(b[key] || '');
    });
    setTasks(sorted);
    setSortKey(key);
  };

  const cellStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    padding: '18px 8px',
    textAlign: 'center',
    fontSize: '15px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#145E75',
    color: 'white',
    border: '3px solid #063645',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  };

  const sortIconStyle: React.CSSProperties = {
    marginLeft: '6px',
    fontSize: '12px',
    color: '#888',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: '30px',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>
        📅 Weeklyメンテナンス
      </h1>

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          border: '4px solid #063645',
          borderRadius: '16px',
          backgroundColor: '#F2F7FA',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '500px',
        }}
      >
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#E0EEF3' }}>
                <th style={cellStyle}>完了</th>
                <th style={cellStyle}>
                  メンテナンス項目
                  <span
                    style={sortIconStyle}
                    onClick={() => handleSort('item')}
                  >
                    ↓
                  </span>
                </th>
                <th style={cellStyle}>
                  場所
                  <span
                    style={sortIconStyle}
                    onClick={() => handleSort('place')}
                  >
                    ↓
                  </span>
                </th>
                <th style={cellStyle}>
                  推奨日
                  <span
                    style={sortIconStyle}
                    onClick={() => handleSort('day')}
                  >
                    ↓
                  </span>
                </th>
                <th style={cellStyle}>完了ログ</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr
                  key={task.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? '#D6EAF3' : '#fff',
                  }}
                >
                  <td style={cellStyle}>
                    <input
                      type="checkbox"
                      checked={checkedIds.includes(task.id)}
                      onChange={() => handleCheck(task.id)}
                    />
                  </td>
                  <td style={cellStyle}>
                    {task.fileUrl ? (
                      <a
                        href={task.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#176B87',
                          fontWeight: 'bold',
                        }}
                      >
                        {task.item}
                      </a>
                    ) : (
                      task.item
                    )}
                  </td>
                  <td style={cellStyle}>{task.place}</td>
                  <td style={cellStyle}>{task.day}</td>
                  <td style={cellStyle}>
                    {task.log && task.user
                      ? `${task.log}・${task.user}`
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
        }}
      >
        <button style={buttonStyle} onClick={() => router.push('/menu')}>
          戻る
        </button>
        <button style={buttonStyle} onClick={handleUpdate}>
          更新
        </button>
      </div>
    </div>
  );
};

export default Weekly;
