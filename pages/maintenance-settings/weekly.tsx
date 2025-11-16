// pages/maintenance-settings/weekly.tsx

import type React from 'react';
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

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];

type WeeklyTask = {
  id: string;
  item: string;
  place: string;
  day: string;
  office: string;
  visible: boolean;
  fileUrl?: string;
  fileName?: string;
};

const WeeklyMaintenanceSettings = () => {
  const router = useRouter();

  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [offices, setOffices] = useState<string[]>([]);

  // 追加用フォーム
  const [newTask, setNewTask] = useState<{
    item: string;
    place: string;
    day: string;
    office: string;
    visible: boolean;
  }>({
    item: '',
    place: '',
    day: '未選択',
    office: '宮崎工務所',
    visible: true,
  });

  // 参照ファイル編集用
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      // weeklySettings 読み込み
      const snap = await getDocs(collection(db, 'weeklySettings'));
      const fetched: WeeklyTask[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          item: data.item || '',
          place: data.place || '',
          day: data.day || '未選択',
          office: data.office || 'ALL',
          visible: data.visible ?? true,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        };
      });
      setTasks(fetched);

      // 所属箇所マスタ（offices コレクション）
      const officesSnap = await getDocs(collection(db, 'offices'));
      const officeNames = officesSnap.docs.map((o) => {
        const d = o.data() as any;
        return (d.name as string) || o.id;
      });
      officeNames.sort((a, b) => a.localeCompare(b));
      setOffices(officeNames);

      // 追加フォームのデフォルト office
      if (officeNames.length > 0) {
        setNewTask((prev) => ({
          ...prev,
          office: officeNames.find((o) => o === '宮崎工務所') ?? officeNames[0],
        }));
      }
    };

    fetchData();
  }, []);

  // 行の値変更（項目名・場所・曜日・所属箇所・表示）
  const handleChange = (id: string, field: keyof WeeklyTask, value: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'weeklySettings', id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // 追加
  const handleAdd = () => {
    if (!newTask.item || !newTask.place) {
      alert('項目と場所は必須です');
      return;
    }
    const newId = `task_${Date.now()}`;
    const task: WeeklyTask = {
      id: newId,
      item: newTask.item,
      place: newTask.place,
      day: newTask.day,
      office: newTask.office,
      visible: newTask.visible,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask((prev) => ({
      ...prev,
      item: '',
      place: '',
      day: '未選択',
      visible: true,
    }));
  };

  // 保存（全行を Firestore に書き込み）
  const handleSave = async () => {
    try {
      const promises = tasks.map((t) =>
        setDoc(doc(db, 'weeklySettings', t.id), t),
      );
      await Promise.all(promises);
      alert('保存しました');
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
    }
  };

  // 参照ファイル：編集開始
  const handleStartEditLink = (taskId: string, currentUrl?: string) => {
    setEditingLinkId(taskId);
    setEditingLink(currentUrl ?? '');
  };

  // 参照ファイル：保存
  const handleSaveLink = (taskId: string) => {
    if (!editingLink.trim()) {
      // 空で完了 → 何もしない（必要ならここでリンク削除してもOK）
      setEditingLinkId(null);
      setEditingLink('');
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, fileUrl: editingLink.trim(), fileName: '参照ファイル' }
          : t,
      ),
    );
    setEditingLinkId(null);
    setEditingLink('');
  };

  // ソート（お好みで使う場合）
  const handleSort = (key: keyof WeeklyTask) => {
    const sorted = [...tasks].sort((a, b) => {
      if (key === 'day') {
        return (
          days.indexOf(a.day || '未選択') - days.indexOf(b.day || '未選択')
        );
      }
      const av = (a[key] as string) || '';
      const bv = (b[key] as string) || '';
      return av.localeCompare(bv);
    });
    setTasks(sorted);
  };

  // スタイル
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

  return (
    <div style={{ padding: '40px', backgroundColor: '#F2F7FA', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        Weekly メンテナンス設定
      </h1>

      {/* 追加フォーム */}
      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 0 6px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <label>項目</label>
          <input
            value={newTask.item}
            onChange={(e) =>
              setNewTask({ ...newTask, item: e.target.value })
            }
            style={{ width: '100%', padding: '6px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label>場所</label>
          <input
            value={newTask.place}
            onChange={(e) =>
              setNewTask({ ...newTask, place: e.target.value })
            }
            style={{ width: '100%', padding: '6px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label>推奨日</label>
          <select
            value={newTask.day}
            onChange={(e) =>
              setNewTask({ ...newTask, day: e.target.value })
            }
            style={{ width: '100%', padding: '6px', fontSize: '14px' }}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label>所属箇所（表示対象）</label>
          <select
            value={newTask.office}
            onChange={(e) =>
              setNewTask({ ...newTask, office: e.target.value })
            }
            style={{ width: '100%', padding: '6px', fontSize: '14px' }}
          >
            {offices.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: 'block', marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={newTask.visible}
            onChange={(e) =>
              setNewTask({ ...newTask, visible: e.target.checked })
            }
            style={{ marginRight: '4px' }}
          />
          表示する
        </label>

        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <button style={buttonStyle} onClick={handleAdd}>
            追加
          </button>
          <button
            style={{ ...buttonStyle, backgroundColor: '#888', borderColor: '#555' }}
            onClick={() => router.push('/menu')}
          >
            戻る
          </button>
        </div>
      </div>

      {/* 一覧テーブル */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
        }}
      >
        <thead>
          <tr>
            <th style={headerCellStyle} onClick={() => handleSort('item')}>
              項目
            </th>
            <th style={headerCellStyle} onClick={() => handleSort('place')}>
              場所
            </th>
            <th style={headerCellStyle} onClick={() => handleSort('day')}>
              推奨日
            </th>
            <th style={headerCellStyle} onClick={() => handleSort('office')}>
              所属箇所
            </th>
            <th style={headerCellStyle}>参照ファイル</th>
            <th style={headerCellStyle}>表示</th>
            <th style={headerCellStyle}>削除</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td style={cellStyle}>{t.item}</td>
              <td style={cellStyle}>{t.place}</td>
              <td style={cellStyle}>
                <select
                  value={t.day}
                  onChange={(e) =>
                    handleChange(t.id, 'day', e.target.value)
                  }
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
                  value={t.office}
                  onChange={(e) =>
                    handleChange(t.id, 'office', e.target.value)
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
                {t.fileUrl && editingLinkId !== t.id && (
                  <>
                    <a
                      href={t.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.fileName || '参照ファイル'}
                    </a>
                    <br />
                    <button
                      onClick={() => handleStartEditLink(t.id, t.fileUrl)}
                      style={{ marginTop: '4px', fontSize: '12px' }}
                    >
                      リンク変更
                    </button>
                  </>
                )}

                {!t.fileUrl && editingLinkId !== t.id && (
                  <button
                    onClick={() => handleStartEditLink(t.id)}
                    style={{ fontSize: '12px' }}
                  >
                    リンク追加
                  </button>
                )}

                {editingLinkId === t.id && (
                  <div>
                    <input
                      style={{ width: '100%', marginBottom: '4px' }}
                      value={editingLink}
                      onChange={(e) => setEditingLink(e.target.value)}
                      placeholder="https://..."
                    />
                    <button
                      style={{ fontSize: '12px', marginRight: '4px' }}
                      onClick={() => handleSaveLink(t.id)}
                    >
                      完了
                    </button>
                    <button
                      style={{ fontSize: '12px' }}
                      onClick={() => {
                        setEditingLinkId(null);
                        setEditingLink('');
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </td>
              <td style={cellStyle}>
                <input
                  type="checkbox"
                  checked={t.visible}
                  onChange={(e) =>
                    handleChange(t.id, 'visible', e.target.checked)
                  }
                />
              </td>
              <td style={cellStyle}>
                <button onClick={() => handleDelete(t.id)}>
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 保存ボタン */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
        <button style={buttonStyle} onClick={handleSave}>
          保存
        </button>
      </div>
    </div>
  );
};

export default WeeklyMaintenanceSettings;
