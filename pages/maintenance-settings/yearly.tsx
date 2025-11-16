// pages/maintenance-settings/yearly.tsx

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const months = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
  '未選択',
];

type YearlyTask = {
  id: string;
  item: string;
  place: string;
  month: string;
  office: string;
  visible: boolean;
  fileUrl?: string;
  fileName?: string;
};

const YearlyMaintenanceSettings = () => {
  const router = useRouter();

  const [tasks, setTasks] = useState<YearlyTask[]>([]);
  const [offices, setOffices] = useState<string[]>([]);

  const [newTask, setNewTask] = useState<{
    item: string;
    place: string;
    month: string;
    office: string;
    visible: boolean;
  }>({
    item: '',
    place: '',
    month: '未選択',
    office: '宮崎工務所',
    visible: true,
  });

  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      // Yearly 設定読み込み
      const snap = await getDocs(collection(db, 'yearlySettings'));
      const fetched: YearlyTask[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          item: data.item || '',
          place: data.place || '',
          month: data.month || '未選択',
          office: data.office || 'ALL',
          visible: data.visible ?? true,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        };
      });
      setTasks(fetched);

      // 所属箇所マスタ offices 読み込み
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

  // 行の値変更
  const handleChange = (id: string, field: keyof YearlyTask, value: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'yearlySettings', id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // 追加
  const handleAdd = () => {
    if (!newTask.item || !newTask.place) {
      alert('項目と場所は必須です');
      return;
    }
    const newId = `task_${Date.now()}`;
    const task: YearlyTask = {
      id: newId,
      item: newTask.item,
      place: newTask.place,
      month: newTask.month,
      office: newTask.office,
      visible: newTask.visible,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask((prev) => ({
      ...prev,
      item: '',
      place: '',
      month: '未選択',
      visible: true,
    }));
  };

  // 保存
  const handleSave = async () => {
    try {
      const updates = tasks.map((task) =>
        setDoc(doc(db, 'yearlySettings', task.id), task),
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
      // 空ならキャンセル扱い
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

  return (
    <div style={{ padding: '40px', backgroundColor: '#F2F7FA', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        各メンテナンス設定（Yearlyメンテナンス）
      </h1>

      {/* 一覧テーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>項目</th>
            <th style={headerCellStyle}>場所</th>
            <th style={headerCellStyle}>対象月</th>
            <th style={headerCellStyle}>所属箇所</th>
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
                  value={task.month}
                  onChange={(e) => handleChange(task.id, 'month', e.target.value)}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
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
                      value={editingLink}
                      onChange={(e) => setEditingLink(e.target.value)}
                      style={{ width: '100%', marginBottom: '4px' }}
                      placeholder="https://..."
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
          value={newTask.item}
          placeholder="項目"
          onChange={(e) => setNewTask({ ...newTask, item: e.target.value })}
        />
        <input
          value={newTask.place}
          placeholder="場所"
          onChange={(e) => setNewTask({ ...newTask, place: e.target.value })}
        />
        <select
          value={newTask.month}
          onChange={(e) => setNewTask({ ...newTask, month: e.target.value })}
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={newTask.office}
          onChange={(e) => setNewTask({ ...newTask, office: e.target.value })}
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
        <button
          style={{
            ...buttonStyle,
            fontSize: '16px',
            padding: '8px 20px',
            marginLeft: '12px',
          }}
          onClick={handleAdd}
        >
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

export default YearlyMaintenanceSettings;
