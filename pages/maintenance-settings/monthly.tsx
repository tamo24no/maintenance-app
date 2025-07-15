// pages/maintenance-settings/monthly.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];
const weeks = ['未選択', '第1', '第2', '第3', '第4', '第5'];

const MonthlyMaintenanceSettings = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [originalTasks, setOriginalTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState<any>({ item: '', place: '', week: '未選択', day: '未選択', visible: false });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, 'monthlySettings'));
      const fetched = snap.docs.map((doc) => ({ ...(doc.data() as any), id: doc.id }));
      setTasks(fetched);
      setOriginalTasks(fetched);
    };
    fetchData();
  }, []);

  const handleChange = (id: string, field: string, value: any) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'monthlySettings', id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdd = () => {
    if (!newTask.item || !newTask.place) return alert('項目と場所は必須です');
    const newId = `task_${Date.now()}`;
    setTasks([...tasks, { id: newId, ...newTask }]);
    setNewTask({ item: '', place: '', week: '未選択', day: '未選択', visible: false });
  };

  const handleSave = async () => {
    try {
      const updates = tasks.map((task) => setDoc(doc(db, 'monthlySettings', task.id), task));
      await Promise.all(updates);
      alert('保存しました');
      setOriginalTasks(tasks);
    } catch (err) {
      alert('保存に失敗しました');
    }
  };

  const handleStartEditLink = (taskId: string) => {
    setEditingLinkId(taskId);
    setEditingLink('');
  };

  const handleSaveLink = (taskId: string) => {
    if (!editingLink.trim()) return;
    const newTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, fileUrl: editingLink, fileName: '参照ファイル' } : t
    );
    setTasks(newTasks);
    setEditingLinkId(null);
    setEditingLink('');
  };

  const handleSort = (key: string) => {
    const sorted = [...tasks].sort((a, b) => {
      if (key === 'day') {
        return days.indexOf(a.day || '未選択') - days.indexOf(b.day || '未選択');
      }
      if (key === 'week') {
        return weeks.indexOf(a.week || '未選択') - weeks.indexOf(b.week || '未選択');
      }
      return (a[key] || '').localeCompare(b[key] || '');
    });
    setTasks(sorted);
    setSortKey(key);
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px',
    textAlign: 'center',
    borderBottom: '1px solid #ccc',
    fontSize: '16px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 28px',
    backgroundColor: '#145E75',
    color: 'white',
    border: '4px solid #063645',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer'
  };

  const sortIconStyle: React.CSSProperties = {
    marginLeft: '6px',
    fontSize: '12px',
    color: '#888',
    cursor: 'pointer'
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>各メンテナンス設定（Monthlyメンテナンス）</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cellStyle}>メンテナンス項目<span style={sortIconStyle} onClick={() => handleSort('item')}>↓</span></th>
            <th style={cellStyle}>場所<span style={sortIconStyle} onClick={() => handleSort('place')}>↓</span></th>
            <th style={cellStyle}>推奨週<span style={sortIconStyle} onClick={() => handleSort('week')}>↓</span></th>
            <th style={cellStyle}>推奨日<span style={sortIconStyle} onClick={() => handleSort('day')}>↓</span></th>
            <th style={cellStyle}>参照ファイル</th>
            <th style={cellStyle}>表示</th>
            <th style={cellStyle}>削除</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr key={task.id} style={{ backgroundColor: index % 2 === 0 ? '#D6EAF3' : '#fff' }}>
              <td style={cellStyle}>{task.item}</td>
              <td style={cellStyle}>{task.place}</td>
              <td style={cellStyle}>
                <select value={task.week} onChange={(e) => handleChange(task.id, 'week', e.target.value)}>
                  {weeks.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </td>
              <td style={cellStyle}>
                <select value={task.day} onChange={(e) => handleChange(task.id, 'day', e.target.value)}>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </td>
              <td style={cellStyle}>
                {task.fileUrl ? (
                  <>
                    <a href={task.fileUrl} target="_blank" rel="noopener noreferrer">{task.fileName || '参照ファイル'}</a><br />
                    <button onClick={() => handleStartEditLink(task.id)} style={{ fontSize: '12px' }}>リンク変更</button>
                  </>
                ) : editingLinkId === task.id ? (
                  <>
                    <input type="text" value={editingLink} onChange={(e) => setEditingLink(e.target.value)} />
                    <button onClick={() => handleSaveLink(task.id)}>完了</button>
                  </>
                ) : (
                  <button onClick={() => handleStartEditLink(task.id)}>リンク追加</button>
                )}
              </td>
              <td style={cellStyle}>
                <input
                  type="checkbox"
                  checked={task.visible}
                  onChange={(e) => handleChange(task.id, 'visible', e.target.checked)}
                />
              </td>
              <td style={cellStyle}>
                <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={20} color="#333" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <input type="text" placeholder="項目名" value={newTask.item} onChange={(e) => setNewTask({ ...newTask, item: e.target.value })} />
        <input type="text" placeholder="場所" value={newTask.place} onChange={(e) => setNewTask({ ...newTask, place: e.target.value })} />
        <select value={newTask.week} onChange={(e) => setNewTask({ ...newTask, week: e.target.value })}>
          {weeks.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={newTask.day} onChange={(e) => setNewTask({ ...newTask, day: e.target.value })}>
          {days.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <label>
          <input type="checkbox" checked={newTask.visible} onChange={(e) => setNewTask({ ...newTask, visible: e.target.checked })} /> 表示
        </label>
        <button style={buttonStyle} onClick={handleAdd}>追加</button>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
        <button style={buttonStyle} onClick={() => router.push('/menu')}>戻る</button>
        <button style={buttonStyle} onClick={handleSave}>保存</button>
      </div>
    </div>
  );
};

export default MonthlyMaintenanceSettings;
