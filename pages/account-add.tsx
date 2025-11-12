// pages/account-add.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { db } from "../lib/firebase"; // 既存の firebase 初期化を使う
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { hashPassword } from "../lib/hashPassword";

const AccountAddPage = () => {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !employeeId || !password) {
      setError("すべての項目を入力してください。");
      return;
    }
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません。");
      return;
    }

    try {
      setLoading(true);

      const userRef = doc(db, "users", employeeId);
      const existing = await getDoc(userRef);
      if (existing.exists()) {
        setError("この社員番号はすでに登録されています。");
        setLoading(false);
        return;
      }

      const passwordHash = await hashPassword(password);

      await setDoc(userRef, {
        name,
        employeeId,
        passwordHash,
        createdAt: serverTimestamp(),
      });

      alert("アカウントを登録しました。");
      router.push("/menu");
    } catch (err) {
      console.error(err);
      setError("登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>アカウントの追加</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>氏名</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>社員番号（ログインID）</label>
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </div>
        <div>
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>パスワード（確認）</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "登録中..." : "登録"}
        </button>
      </form>
    </div>
  );
};

export default AccountAddPage;
