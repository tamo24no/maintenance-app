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
  writeBatch,
} from 'firebase/firestore';

type WeeklyTask = {
  id: string;
  item: string;
  place: string;
  day: string;
  office?: string;   // 所属箇所（設定画面で保存しているフィールド）
  fileUrl?: string;
  log?: string;
  user?: string;
};

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];

const Weekly = () => {
  const router = useRouter();

  const [allTasks, setAllTasks] = useState<WeeklyTask[]>([]);
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [userOffice, setUserOffice] = useState<string>('ALL');
  const [officeFilter, setOfficeFilter] = useState<string>('ALL');
  const [offices, setOffices] = useState<string[]>([]);

  // 所属箇所フィルタ
  const filterByOffice = (source: WeeklyTask[], office: string) => {
    if (office === 'ALL') return source;
    // 「自箇所 or 共通(ALL) or office未設定」を表示
    return source.filter(
      (t) => t.office === office || t.office === 'ALL' || !t.office
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      // --- ログインユーザー情報取得 ---
      let name = '';
      let office = 'ALL';

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('maintenanceAppUser');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user?.name) name = user.name;
            else if (user?.employeeId) name = user.employeeId;

            if (user?.office) office = user.office; // 宮崎工務所 / 南延岡工務室 / ALL など
          } catch {
            // 無視
          }
        }
      }

      setUserName(name || 'ゲストユーザー');
      setUserOffice(office);
      setOfficeFilter(office);

      // --- weeklySettings & offices をまとめて取得 ---
      const [settingsSnap, officesSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'weeklySettings'),
            where('visible', '==', true)
          )
        ),
        getDocs(collection(db, 'offices')),
      ]);

      const all: WeeklyTask[] = await Promise.all(
        settingsSnap.docs.map(async (docSnap) => {
          const data = docSnap.data() as any;
          const task: WeeklyTask = {
            id: docSnap.id,
            item: data.item || '',
            place: data.place || '',
            day: data.day || '未選択',
            office: data.office || 'ALL',
            fileUrl: data.fileUrl,
          };

          // 完了ログ
          const logRef = doc(db, 'weeklyChecks', task.id);
          const logSnap = await getDoc(logRef);
          const logData = logSnap.exists() ? logSnap.data() : null;

          return {
            ...task,
            log: (logData as any)?.timestamp || '',
            user: (logData as any)?.user || '',
          };
        })
      );

      setAllTasks(all);
      setTasks(filterByOffice(all, office));
      setCheckedIds([]); // 初期は全て未チェック

      // 所属箇所プルダウン候補
      const officeNames = officesSnap.docs.map((o) => {
        const d = o.data() as any;
        return (d.name as string) || o.id;
      });
      officeNames.sort((a, b) => a.localeCompare(b));

      const uniqueOffices = Array.from(new Set(['ALL', ...officeNames]));
      setOffices(uniqueOffices);
    };

    fetchData();
  }, []);

  // チェック操作
  const handleCheck = (taskId: string) => {
    setCheckedIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // 所属箇所フィルタ変更
  const handleOfficeChange = (office: string) => {
    setOfficeFilter(office);
    setTasks(filterByOffice(allTasks, office));
    setCheckedIds([]); // フィルタ変更時はいったんリセット
  };

  // 更新（チェックが付いているものだけログ更新）
  const handleUpdate = async () => {
    if (!userName) {
      alert('ユーザー情報が取得できませんでした。ログインし直してください。');
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    const batch = writeBatch(db);

    for (const taskId of checkedIds) {
      const logRef = doc(db, 'weeklyChecks', taskId);
      batch.set(
        logRef,
        {
          timestamp: now,
          user: userName,
        },
        { merge: true }
      );
    }

    await batch.commit();

    alert('更新が完了しました');
    location.reload();
  };

  // ソート
  const handleSort = (key: string) => {
    const sorted = [...tasks].sort((a: any, b: any) => {
      if (key === 'day') {
        return (
          days.indexOf(a[key] || '未選択') -
          days.indexOf(b[key] || '未選択')
        );
      }
      return (a[key] || '').localeCompare(b[key] || '');
    });
    setTasks(sorted);
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
      {/* タイトル + 所属箇所プルダウン */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h1 style={{ fontSize: '24px' }}>
          📅 Weeklyメンテナンス（{officeFilter}）
        </h1>

        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>
            表示箇所
          </label>
          <select
            value={officeFilter}
            onChange={(e) => handleOfficeChange(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '14px' }}
          >
            {offices.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* テーブル本体 */}
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
                    backgroundColor: index % 2 === 0 ? '#D6EAF3' : '#fff',
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
                        style={{ color: '#176B87', fontWeight: 'bold' }}
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
                    {task.log && task.user ? `${task.log}・${task.user}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ボタン */}
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
