// pages/account-add.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { hashPassword } from "../lib/hashPassword";

const AccountAddPage = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [offices, setOffices] = useState<{ id: string; name: string }[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Firestore の offices を読み込む
  useEffect(() => {
    const fetchOffices = async () => {
      const snap = await getDocs(collection(db, "offices"));

      const list = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        name: (docSnap.data().name as string) || docSnap.id,
      }));

      // 名前昇順でソート
      list.sort((a, b) => a.name.localeCompare(b.name));
      setOffices(list);

      // デフォルト（宮崎工務所 or 最初の1件）
      const defaultOffice =
        list.find((o) => o.name === "宮崎工務所") ?? list[0];

      if (defaultOffice) setSelectedOffice(defaultOffice.name);
    };

    fetchOffices();
  }, []);

  // アカウント作成処理
  const handleSubmit = async () => {
    setMessage(null);

    if (!name || !employeeId || !password || !passwordConfirm) {
      setMessage("すべての項目を入力してください。");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("パスワードが一致しません。");
      return;
    }

    if (password.length < 6) {
      setMessage("パスワードは6文字以上にしてください。");
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, "users", employeeId);

      // ハッシュ化
      const passwordHash = await hashPassword(password);

      await setDoc(userRef, {
        name,
        employeeId,
        office: selectedOffice,
        passwordHash: passwordHash,
      });

      setMessage("アカウントを作成しました。");

      // フォームリセット
      setName("");
      setEmployeeId("");
      setPassword("");
      setPasswordConfirm("");

    } catch (err) {
      console.error(err);
      setMessage("アカウント作成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        backgroundColor: "#F2F7FA",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "24px" }}>
        アカウント追加
      </h1>

      <div style={{ maxWidth: "480px" }}>
        {/* 氏名 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold" }}>氏名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          />
        </div>

        {/* 社員番号 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold" }}>社員番号</label>
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          />
        </div>

        {/* パスワード */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold" }}>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          />
        </div>

        {/* パスワード（確認） */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold" }}>パスワード（確認）</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          />
        </div>

        {/* 所属箇所 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "bold" }}>所属箇所</label>
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          >
            {offices.map((office) => (
              <option key={office.id} value={office.name}>
                {office.name}
              </option>
            ))}
          </select>
        </div>

        {/* メッセージ */}
        {message && (
          <div
            style={{
              whiteSpace: "pre-line",
              color: "red",
              marginBottom: "16px",
            }}
          >
            {message}
          </div>
        )}

        {/* ボタン */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => router.push("/other-settings")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#888",
              color: "white",
              borderRadius: "6px",
            }}
          >
            戻る
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#145E75",
              color: "white",
              borderRadius: "6px",
              fontWeight: "bold",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "作成中..." : "アカウント作成"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountAddPage;
