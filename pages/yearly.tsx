// pages/yearly.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

const monthOrder = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '未選択'];

const Yearly = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, 'yearlySettings'));
      const tasksWithLogs = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const task = { id: docSnap.id, ...docSnap.data() };
          const logRef = doc(db, 'yearlyChecks', task.id);
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
      setCheckedIds(
        tasksWithLogs.filter((task) => task.log && task.user).map((task) => task.id)
      );
    };
    fetchData();
  }, []);

  const handleCheck = (taskId: string) => {
    setCheckedIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleUpdate = async () => {
    const now = new Date().toISOString().split('T')[0];
    const userName = '管理者'; // ログインなしなので固定名に

    for (const task of tasks) {
      const logRef = doc(db, 'yearlyChecks', task.id);
      if (checkedIds.includes(task.id)) {
        await setDoc(logRef, { timestamp: now, user: userName });
      } else {
        await setDoc(logRef, {});
      }
    }

    alert('更新が完了しました');
    location.reload();
  };

  const handleSort = (key: string) => {
    const sorted = [...tasks].sort((a, b) => {
      const aVal = a[key] || '未選択';
      const bVal = b[key] || '未選択';

      if (key === 'month') {
        return monthOrder.indexOf(aVal) - monthOrder.indexOf(bVal);
      } else {
        return (aVal as string).localeCompare(bVal);
      }
    });

    setTasks(sorted);
    setSortKey(key);
  };

  const cellStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    padding: '16px 8px',
    textAlign: 'center',
    fontSize: '16px',
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '30px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>📅 Yearlyメンテナンス</h1>

      <div style={{
        flex: 1,
        overflow: 'hidden',
        border: '4px solid #063645',
        borderRadius: '16px',
        backgroundColor: '#F2F7FA',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '400px'
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#E0EEF3' }}>
                <th style={cellStyle}>完了</th>
                <th style={cellStyle}>
                  メンテナンス項目
                  <span style={sortIconStyle} onClick={() => handleSort('item')}>↓</span>
                </th>
                <th style={cellStyle}>
                  場所
                  <span style={sortIconStyle} onClick={() => handleSort('place')}>↓</span>
                </th>
                <th style={cellStyle}>
                  推奨月
                  <span style={sortIconStyle} onClick={() => handleSort('month')}>↓</span>
                </th>
                <th style={cellStyle}>完了ログ</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr key={task.id} style={{ backgroundColor: index % 2 === 0 ? '#D6EAF3' : '#fff' }}>
                  <td style={cellStyle}>
                    <input
                      type="checkbox"
                      checked={checkedIds.includes(task.id)}
                      onChange={() => handleCheck(task.id)}
                    />
                  </td>
                  <td style={cellStyle}>
                    {task.fileUrl ? (
                      <a href={task.fileUrl} target="_blank" rel="noopener noreferrer">{task.item}</a>
                    ) : task.item}
                  </td>
                  <td style={cellStyle}>{task.place}</td>
                  <td style={cellStyle}>{task.month || '未選択'}</td>
                  <td style={cellStyle}>
                    {task.log && task.user ? `${task.log}・${task.user}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ flexShrink: 0, marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button style={buttonStyle} onClick={() => router.push('/menu')}>戻る</button>
        <button style={buttonStyle} onClick={handleUpdate}>更新</button>
      </div>
    </div>
  );
};

export default Yearly;
