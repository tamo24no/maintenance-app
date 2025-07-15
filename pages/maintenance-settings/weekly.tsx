// pages/maintenance-settings/weekly.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];

const WeeklyMaintenanceSettings = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [originalTasks, setOriginalTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState<any>({ item: '', place: '', day: '未選択', visible: false });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, 'weeklySettings'));
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
    await deleteDoc(doc(db, 'weeklySettings', id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdd = () => {
    if (!newTask.item || !newTask.place) return alert('項目と場所は必須です');
    const newId = `task_${Date.now()}`;
    setTasks([...tasks, { id: newId, ...newTask }]);
    setNewTask({ item: '', place: '', day: '未選択', visible: false });
  };

  const handleSave = async () => {
    try {
      const updates = tasks.map((task) => setDoc(doc(db, 'weeklySettings', task.id), task));
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
      return (a[key] || '').localeCompare(b[key] || '');
    });
    setTasks(sorted);
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

  const cellStyle: React.CSSProperties = {
    padding: '12px',
    textAlign: 'center',
    borderBottom: '1px solid #ccc',
    fontSize: '16px'
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>各メンテナンス設定（Weeklyメンテナンス）</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cellStyle}>項目</th>
            <th style={cellStyle}>場所</th>
            <th style={cellStyle}>推奨日</th>
            <th style={cellStyle}>参照ファイル</th>
            <th style={cellStyle}>表示</th>
            <th style={cellStyle}>削除</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td style={cellStyle}>{task.item}</td>
              <td style={cellStyle}>{task.place}</td>
              <td style={cellStyle}>
                <select value={task.day} onChange={(e) => handleChange(task.id, 'day', e.target.value)}>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </td>
              <td style={cellStyle}>
                {task.fileUrl ? (
                  <>
                    <a href={task.fileUrl} target="_blank">{task.fileName || '参照ファイル'}</a><br />
                    <button onClick={() => handleStartEditLink(task.id)}>リンク変更</button>
                  </>
                ) : editingLinkId === task.id ? (
                  <>
                    <input value={editingLink} onChange={(e) => setEditingLink(e.target.value)} />
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
                <button onClick={() => handleDelete(task.id)}>
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <input value={newTask.item} placeholder="項目" onChange={(e) => setNewTask({ ...newTask, item: e.target.value })} />
        <input value={newTask.place} placeholder="場所" onChange={(e) => setNewTask({ ...newTask, place: e.target.value })} />
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

export default WeeklyMaintenanceSettings;
