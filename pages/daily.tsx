// pages/daily.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];

const Daily = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [userOffice, setUserOffice] = useState<string>('ALL');      // ログインユーザーの所属
  const [selectedOffice, setSelectedOffice] = useState<string>('ALL'); // 画面右上の選択値
  const [officeOptions, setOfficeOptions] = useState<string[]>(['ALL']); // プルダウン候補
  const router = useRouter();

  // ---------- Firestore からタスクを読み込む（office ごと） ----------
  const loadTasks = async (office: string) => {
    let q;

    if (office === 'ALL') {
      q = query(
        collection(db, 'dailySettings'),
        where('visible', '==', true)
      );
    } else {
      // office または ALL（共通）だけ
      q = query(
        collection(db, 'dailySettings'),
        where('visible', '==', true),
        where('office', 'in', [office, 'ALL'])
      );
    }

    const snap = await getDocs(q);

    const tasksWithLogs = await Promise.all(
      snap.docs.map(async (docSnap) => {
      const task = { id: docSnap.id, ...docSnap.data() } as any;

      // 念のためクライアント側でもフィルタ
      if (
        office !== 'ALL' &&
        task.office !== office &&
        task.office !== 'ALL'
      ) {
        return null;
      }

      const logRef = doc(db, 'dailyChecks', task.id);
      const logSnap = await getDoc(logRef);
      const logData = logSnap.exists() ? logSnap.data() : null;

      return {
        ...task,
        log: logData?.timestamp || '',
        user: logData?.user || '',
      };
    })
    );

    const filtered = tasksWithLogs.filter((t): t is any => t !== null);

    setTasks(filtered);
    setCheckedIds(
      filtered
        .filter((task) => task.log && task.user)
        .map((task) => task.id)
    );
  };

  // ---------- 初期処理：所属箇所＆プルダウン候補の取得 ----------
  useEffect(() => {
    const init = async () => {
      // ログインユーザーの所属箇所（なければ ALL）
      let office = 'ALL';
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('maintenanceAppUser');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user?.office) {
              office = user.office; // 例: 宮崎工務所 / 南延岡工務室 / ALL
            }
          } catch {
            // 失敗したら ALL のまま
          }
        }
      }
      setUserOffice(office);
      setSelectedOffice(office);

      // offices コレクションから候補を取得
      const snap = await getDocs(collection(db, 'offices'));
      const list = snap.docs.map((d) => {
        const data = d.data();
        return (data.name as string) || d.id;
      });
      list.sort((a, b) => a.localeCompare(b));

      // ALL + 取得した office をユニークにしてセット
      const uniq = Array.from(new Set(['ALL', ...list]));
      setOfficeOptions(uniq);

      // 初期表示のタスク読み込み
      await loadTasks(office);
    };

    init();
  }, []);

  // ---------- 箇所プルダウン変更 ----------
  const handleOfficeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const office = e.target.value;
    setSelectedOffice(office);
    await loadTasks(office);
  };

  // ---------- チェックボックス ----------
  const handleCheck = (taskId: string) => {
    const newCheckedIds = checkedIds.includes(taskId)
      ? checkedIds.filter((id) => id !== taskId)
      : [...checkedIds, taskId];
    setCheckedIds(newCheckedIds);
  };

  // ---------- 更新（完了ログ保存：チェックついたものだけ上書き） ----------
  const handleUpdate = async () => {
    const now = new Date().toISOString().split('T')[0];

    let userName = 'ゲストユーザー';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('maintenanceAppUser');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u?.name) userName = u.name;
        } catch {
          // そのままゲスト
        }
      }
    }

    for (const task of tasks) {
      const logRef = doc(db, 'dailyChecks', task.id);
      if (checkedIds.includes(task.id)) {
        await setDoc(logRef, {
          timestamp: now,
          user: userName,
        });
      }
      // チェック外しは何もしない → 過去ログは残す
    }

    alert('更新が完了しました');
    location.reload();
  };

  // ---------- ソート ----------
  const handleSort = (key: string) => {
    const sorted = [...tasks].sort((a, b) => {
      if (key === 'day') {
        return days.indexOf(a[key] || '未選択') - days.indexOf(b[key] || '未選択');
      }
      return (a[key] || '').localeCompare(b[key] || '');
    });
    setTasks(sorted);
  };

  // ---------- スタイル ----------
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
      {/* タイトル & 箇所プルダウン（右上） */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h1 style={{ fontSize: '24px' }}>
          📅 Dailyメンテナンス（{selectedOffice}）
        </h1>

        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>
            表示箇所：
          </label>
          <select
            value={selectedOffice}
            onChange={handleOfficeChange}
            style={{ padding: '6px 8px', fontSize: '14px' }}
          >
            {officeOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            ※ デフォルトは所属箇所（{userOffice}）
          </div>
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
                  <span style={sortIconStyle} onClick={() => handleSort('item')}>
                    ↓
                  </span>
                </th>
                <th style={cellStyle}>
                  場所
                  <span style={sortIconStyle} onClick={() => handleSort('place')}>
                    ↓
                  </span>
                </th>
                <th style={cellStyle}>
                  推奨日
                  <span style={sortIconStyle} onClick={() => handleSort('day')}>
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

export default Daily;
