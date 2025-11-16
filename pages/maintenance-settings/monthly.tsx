// pages/maintenance-settings/monthly.tsx
import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];
const weeks = ['未選択', '第1', '第2', '第3', '第4', '第5'];

type MonthlyTask = {
  id: string;
  item: string;
  place: string;
  week: string;
  day: string;
  office: string;
  visible: boolean;
  fileUrl?: string;
  fileName?: string;
};

const MonthlyMaintenanceSettings = () => {
  const router = useRouter();

  const [tasks, setTasks] = useState<MonthlyTask[]>([]);
  const [offices, setOffices] = useState<string[]>([]);

  const [newTask, setNewTask] = useState<{
    item: string;
    place: string;
    week: string;
    day: string;
    office: string;
    visible: boolean;
  }>({
    item: '',
    place: '',
    week: '未選択',
    day: '未選択',
    office: '宮崎工務所',
    visible: true,
  });

  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      // monthlySettings の読み込み
      const snap = await getDocs(collection(db, 'monthlySettings'));
      const fetched: MonthlyTask[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          item: data.item || '',
          place: data.place || '',
          week: data.week || '未選択',
          day: data.day || '未選択',
          office: data.office || 'ALL',
          visible: data.visible ?? true,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        };
      });
      setTasks(fetched);

      // 所属箇所マスタ offices
      const officesSnap = await getDocs(collection(db, 'offices'));
      const officeNames = officesSnap.docs.map((o) => {
        const d = o.data() as any;
        return (d.name as string) || o.id;
      });
      officeNames.sort((a, b) => a.localeCompare(b));
      setOffices(officeNames);

      // 追加用フォームのデフォルト office
      if (officeNames.length > 0) {
        setNewTask((prev) => ({
          ...prev,
          office: officeNames.find((o) => o === '宮崎工務所') ?? officeNames[0],
        }));
      }
    };

    fetchData();
  }, []);

  // 行の値変更
  const handleChange = (id: string, field: keyof MonthlyTask, value: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'monthlySettings', id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // 追加
  const handleAdd = () => {
    if (!newTask.item || !newTask.place) {
      alert('項目と場所は必須です');
      return;
    }
    const newId = `task_${Date.now()}`;
    const task: MonthlyTask = {
      id: newId,
      item: newTask.item,
      place: newTask.place,
      week: newTask.week,
      day: newTask.day,
      office: newTask.office,
      visible: newTask.visible,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask((prev) => ({
      ...prev,
      item: '',
      place: '',
      week: '未選択',
      day: '未選択',
      visible: true,
    }));
  };

  // 保存
  const handleSave = async () => {
    try {
      const updates = tasks.map((task) =>
        setDoc(doc(db, 'monthlySettings', task.id), task),
      );
      await Promise.all(updates);
      alert('保存しました');
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    }
  };

  // リンク編集開始
  const handleStartEditLink = (taskId: string, currentUrl?: string) => {
    setEditingLinkId(taskId);
    setEditingLink(currentUrl ?? '');
  };

  // リンク保存
  const handleSaveLink = (taskId: string) => {
    if (!editingLink.trim()) {
      setEditingLinkId(null);
      setEditingLink('');
      return;
    }
    const newTasks = tasks.map((t) =>
      t.id === taskId
        ? { ...t, fileUrl: editingLink.trim(), fileName: '参照ファイル' }
        : t,
    );
    setTasks(newTasks);
    setEditingLinkId(null);
    setEditingLink('');
  };

  // ソート
  const handleSort = (key: keyof MonthlyTask) => {
    const sorted = [...tasks].sort((a, b) => {
      if (key === 'day') {
        return (
          days.indexOf(a.day || '未選択') -
          days.indexOf(b.day || '未選択')
        );
      }
      if (key === 'week') {
        return (
          weeks.indexOf(a.week || '未選択') -
          weeks.indexOf(b.week || '未選択')
        );
      }
      const av = (a[key] as string) || '';
      const bv = (b[key] as string) || '';
      return av.localeCompare(bv);
    });
    setTasks(sorted);
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px',
    textAlign: 'center',
    borderBottom: '1px solid #ccc',
    fontSize: '16px',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: '#E0EEF3',
    fontWeight: 'bold',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 28px',
    backgroundColor: '#145E75',
    color: 'white',
    border: '4px solid #063645',
    borderRadius: '10px',
    fontSize: '18px',
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
    <div style={{ padding: '40px', backgroundColor: '#F2F7FA', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        各メンテナンス設定（Monthlyメンテナンス）
      </h1>

      {/* 一覧テーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>
              メンテナンス項目
              <span style={sortIconStyle} onClick={() => handleSort('item')}>
                ↓
              </span>
            </th>
            <th style={headerCellStyle}>
              場所
              <span style={sortIconStyle} onClick={() => handleSort('place')}>
                ↓
              </span>
            </th>
            <th style={headerCellStyle}>
              推奨週
              <span style={sortIconStyle} onClick={() => handleSort('week')}>
                ↓
              </span>
            </th>
            <th style={headerCellStyle}>
              推奨日
              <span style={sortIconStyle} onClick={() => handleSort('day')}>
                ↓
              </span>
            </th>
            <th style={headerCellStyle}>
              所属箇所
              <span style={sortIconStyle} onClick={() => handleSort('office')}>
                ↓
              </span>
            </th>
            <th style={headerCellStyle}>参照ファイル</th>
            <th style={headerCellStyle}>表示</th>
            <th style={headerCellStyle}>削除</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr
              key={task.id}
              style={{ backgroundColor: index % 2 === 0 ? '#D6EAF3' : '#fff' }}
            >
              <td style={cellStyle}>{task.item}</td>
              <td style={cellStyle}>{task.place}</td>
              <td style={cellStyle}>
                <select
                  value={task.week}
                  onChange={(e) => handleChange(task.id, 'week', e.target.value)}
                >
                  {weeks.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </td>
              <td style={cellStyle}>
                <select
                  value={task.day}
                  onChange={(e) => handleChange(task.id, 'day', e.target.value)}
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </td>
              <td style={cellStyle}>
                <select
                  value={task.office}
                  onChange={(e) =>
                    handleChange(task.id, 'office', e.target.value)
                  }
                >
                  {offices.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </td>
              <td style={cellStyle}>
                {task.fileUrl && editingLinkId !== task.id && (
                  <>
                    <a
                      href={task.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {task.fileName || '参照ファイル'}
                    </a>
                    <br />
                    <button
                      onClick={() =>
                        handleStartEditLink(task.id, task.fileUrl)
                      }
                      style={{ fontSize: '12px', marginTop: '4px' }}
                    >
                      リンク変更
                    </button>
                  </>
                )}

                {!task.fileUrl && editingLinkId !== task.id && (
                  <button
                    onClick={() => handleStartEditLink(task.id)}
                    style={{ fontSize: '12px' }}
                  >
                    リンク追加
                  </button>
                )}

                {editingLinkId === task.id && (
                  <>
                    <input
                      type="text"
                      value={editingLink}
                      placeholder="https://..."
                      onChange={(e) => setEditingLink(e.target.value)}
                      style={{ width: '100%', marginBottom: '4px' }}
                    />
                    <button
                      onClick={() => handleSaveLink(task.id)}
                      style={{ fontSize: '12px', marginRight: '4px' }}
                    >
                      完了
                    </button>
                    <button
                      onClick={() => {
                        setEditingLinkId(null);
                        setEditingLink('');
                      }}
                      style={{ fontSize: '12px' }}
                    >
                      キャンセル
                    </button>
                  </>
                )}
              </td>
              <td style={cellStyle}>
                <input
                  type="checkbox"
                  checked={task.visible}
                  onChange={(e) =>
                    handleChange(task.id, 'visible', e.target.checked)
                  }
                />
              </td>
              <td style={cellStyle}>
                <button
                  onClick={() => handleDelete(task.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Trash2 size={20} color="#333" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 追加フォーム */}
      <div style={{ marginTop: '20px' }}>
        <input
          type="text"
          placeholder="項目名"
          value={newTask.item}
          onChange={(e) =>
            setNewTask({ ...newTask, item: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="場所"
          value={newTask.place}
          onChange={(e) =>
            setNewTask({ ...newTask, place: e.target.value })
          }
        />
        <select
          value={newTask.week}
          onChange={(e) =>
            setNewTask({ ...newTask, week: e.target.value })
          }
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <select
          value={newTask.day}
          onChange={(e) =>
            setNewTask({ ...newTask, day: e.target.value })
          }
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={newTask.office}
          onChange={(e) =>
            setNewTask({ ...newTask, office: e.target.value })
          }
        >
          {offices.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <label style={{ marginLeft: '8px' }}>
          <input
            type="checkbox"
            checked={newTask.visible}
            onChange={(e) =>
              setNewTask({ ...newTask, visible: e.target.checked })
            }
          />{' '}
          表示
        </label>
        <button style={{ ...buttonStyle, fontSize: '16px', padding: '8px 20px', marginLeft: '12px' }} onClick={handleAdd}>
          追加
        </button>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
        <button
          style={{ ...buttonStyle, backgroundColor: '#888', borderColor: '#555' }}
          onClick={() => router.push('/menu')}
        >
          戻る
        </button>
        <button style={buttonStyle} onClick={handleSave}>
          保存
        </button>
      </div>
    </div>
  );
};

export default MonthlyMaintenanceSettings;
