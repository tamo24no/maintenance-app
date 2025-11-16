// pages/office-settings.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

type Office = {
  id: string;
  name: string;
};

const OfficeSettingsPage = () => {
  const router = useRouter();

  const [offices, setOffices] = useState<Office[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // offices 一覧取得
  const fetchOffices = async () => {
    const snap = await getDocs(collection(db, "offices"));
    const list: Office[] = snap.docs.map((d) => ({
      id: d.id,
      name: (d.data().name as string) || d.id,
    }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    setOffices(list);
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  // 追加 or 更新
  const handleSave = async () => {
    setMessage(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("所属箇所名を入力してください。");
      return;
    }

    // ALL はこの画面から新規追加させない（手入力ミス防止）
    if (trimmed === "ALL" && !editingId) {
      setMessage('「ALL」は特別な値のため、ここから新規追加はできません。');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // 更新
        const target = offices.find((o) => o.id === editingId);
        if (target?.name === "ALL") {
          setMessage('「ALL」は名前を変更できません。');
          setLoading(false);
          return;
        }

        await updateDoc(doc(db, "offices", editingId), {
          name: trimmed,
        });
        setMessage("所属箇所を更新しました。");
      } else {
        // 追加
        await addDoc(collection(db, "offices"), {
          name: trimmed,
        });
        setMessage("所属箇所を追加しました。");
      }

      resetForm();
      await fetchOffices();
    } catch (e) {
      console.error(e);
      setMessage("保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (office: Office) => {
    if (office.name === "ALL") {
      setMessage('「ALL」は編集できません。');
      return;
    }
    setEditingId(office.id);
    setName(office.name);
    setMessage(null);
  };

  const handleDelete = async (office: Office) => {
    if (office.name === "ALL") {
      setMessage('「ALL」は削除できません。');
      return;
    }

    if (!confirm(`「${office.name}」を削除しますか？`)) return;

    try {
      await deleteDoc(doc(db, "offices", office.id));
      setMessage("削除しました。");
      await fetchOffices();
    } catch (e) {
      console.error(e);
      setMessage("削除に失敗しました。");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    fontSize: "16px",
    marginBottom: "12px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "sans-serif",
        backgroundColor: "#F2F7FA",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
        所属箇所マスタ設定
      </h1>

      <p style={{ marginBottom: "12px", color: "#555", fontSize: "14px" }}>
        アカウント登録や各種メンテナンス設定で使用する「所属箇所」の一覧を管理します。
        <br />
        ※「ALL」は全てのデータを見られる特別な値のため、削除・名称変更はできません。
      </p>

      {/* 入力フォーム */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid #ccc",
          maxWidth: "400px",
          marginBottom: "24px",
        }}
      >
        <label style={{ fontWeight: "bold" }}>
          所属箇所名
        </label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例）宮崎工務所"
        />

        {message && (
          <div style={{ color: "red", marginBottom: "8px", whiteSpace: "pre-line" }}>
            {message}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: "#145E75",
              color: "white",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {editingId ? "更新" : "追加"}
          </button>
          <button
            onClick={resetForm}
            style={{ ...buttonStyle, backgroundColor: "#888", color: "white" }}
          >
            クリア
          </button>
          <button
            onClick={() => router.push("/other-settings")}
            style={{ ...buttonStyle, backgroundColor: "#ccc" }}
          >
            戻る
          </button>
        </div>
      </div>

      {/* 一覧 */}
      <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>所属箇所一覧</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "white",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#E0EEF3" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>名称</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {offices.map((office) => (
            <tr key={office.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {office.name}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {office.name === "ALL" ? (
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    ※ALL は編集不可
                  </span>
                ) : (
                  <>
                    <button
                      style={{
                        ...buttonStyle,
                        backgroundColor: "#145E75",
                        color: "white",
                        marginRight: "4px",
                      }}
                      onClick={() => handleEdit(office)}
                    >
                      編集
                    </button>
                    <button
                      style={{
                        ...buttonStyle,
                        backgroundColor: "#c0392b",
                        color: "white",
                      }}
                      onClick={() => handleDelete(office)}
                    >
                      削除
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {offices.length === 0 && (
            <tr>
              <td
                colSpan={2}
                style={{ padding: "12px", textAlign: "center", color: "#666" }}
              >
                登録されている所属箇所はありません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OfficeSettingsPage;
