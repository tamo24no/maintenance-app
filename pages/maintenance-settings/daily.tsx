// pages/maintenance-settings/daily.tsx
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const days = ['月', '火', '水', '木', '金', '土', '日', '未選択'];

const DailyMaintenanceSettings = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [originalTasks, setOriginalTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState<any>({ item: '', place: '', day: '未選択', visible: false });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('');
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) router.push('/login');
      else {
        const snap = await getDocs(collection(db, 'dailySettings'));
        const fetched = snap.docs.map((doc) => ({ ...(doc.data() as any), id: doc.id }));
        const sorted = [...fetched].sort((a, b) => {
          const placeComp = (a.place || '').localeCompare(b.place || '');
          if (placeComp !== 0) return placeComp;
          const itemComp = (a.item || '').localeCompare(b.item || '');
          if (itemComp !== 0) return itemComp;
          return days.indexOf(a.day || '未選択') - days.indexOf(b.day || '未選択');
        });
        setTasks(sorted);
        setOriginalTasks(sorted);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const isDirty = () => {
    return JSON.stringify(tasks) !== JSON.stringify(originalTasks) ||
      newTask.item || newTask.place || newTask.day !== '未選択' || newTask.visible;
  };

  const handleChange = (id: string, field: string, value: any) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await deleteDoc(doc(db, 'dailySettings', id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdd = () => {
    if (!newTask.item || !newTask.place) return alert('項目と場所は必須です');
    if (tasks.some((t) => t.item === newTask.item && t.place === newTask.place)) {
      return alert('既に登録されています');
    }
    const newId = `task_${Date.now()}`;
    setTasks([...tasks, { id: newId, ...newTask }]);
    setNewTask({ item: '', place: '', day: '未選択', visible: false });
  };

  const handleBack = () => {
    if (isDirty() && !confirm('編集の変更を破棄しますか？')) return;
    router.push('/menu');
  };

  const handleSave = async () => {
    try {
      const updates = tasks.map((task) => setDoc(doc(db, 'dailySettings', task.id), task));
      await Promise.all(updates);
      alert('設定を保存しました！');
      setOriginalTasks(tasks);
    } catch (err) {
      console.error(err);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '40px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>
        各メンテナンス設定（Dailyメンテナンス）
      </h1>

      <div style={{ flex: 1, overflowY: 'auto', border: '4px solid #063645', borderRadius: '16px', backgroundColor: '#F2F7FA' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#E0EEF3' }}>
              <th style={cellStyle}>メンテナンス項目<span style={sortIconStyle} onClick={() => handleSort('item')}>↓</span></th>
              <th style={cellStyle}>場所<span style={sortIconStyle} onClick={() => handleSort('place')}>↓</span></th>
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
                  <select value={task.day} onChange={(e) => handleChange(task.id, 'day', e.target.value)}>
                    {days.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </td>
                <td style={cellStyle}>
                  {task.fileUrl ? (
                    <>
                      <a href={task.fileUrl} target="_blank" rel="noopener noreferrer">{task.fileName || '参照ファイル'}</a><br />
                      <button onClick={() => handleStartEditLink(task.id)} style={{ fontSize: '12px' }}>参照リンクを変更</button>
                    </>
                  ) : editingLinkId === task.id ? (
                    <>
                      <input
                        type="text"
                        placeholder="リンクを貼り付け"
                        value={editingLink}
                        onChange={(e) => setEditingLink(e.target.value)}
                      />
                      <button onClick={() => handleSaveLink(task.id)}>完了</button>
                    </>
                  ) : (
                    <button onClick={() => handleStartEditLink(task.id)}>参照ファイルのリンクを貼り付け</button>
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
      </div>

      <div style={{ paddingTop: '10px', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
          <input type="text" placeholder="項目名" value={newTask.item} onChange={(e) => setNewTask({ ...newTask, item: e.target.value })} />
          <input type="text" placeholder="場所" value={newTask.place} onChange={(e) => setNewTask({ ...newTask, place: e.target.value })} />
          <select value={newTask.day} onChange={(e) => setNewTask({ ...newTask, day: e.target.value })}>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <label>
            <input type="checkbox" checked={newTask.visible} onChange={(e) => setNewTask({ ...newTask, visible: e.target.checked })} /> 表示
          </label>
          <button style={buttonStyle} onClick={handleAdd}>メンテナンスの追加</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
          <button style={buttonStyle} onClick={handleBack}>戻る</button>
          <button style={buttonStyle} onClick={handleSave}>更新</button>
        </div>
      </div>
    </div>
  );
};

export default DailyMaintenanceSettings;
