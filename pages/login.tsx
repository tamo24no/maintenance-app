// pages/login.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { hashPassword } from "../lib/hashPassword";

type AuthUser = {
  employeeId: string;
  name: string;
};

const LoginPage = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId || !password) {
      setError("IDとパスワードを入力してください。");
      return;
    }

    try {
      setLoading(true);

      const userRef = doc(db, "users", employeeId);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setError("ユーザーが見つかりません。");
        setLoading(false);
        return;
      }

      const data = snap.data();
      const inputHash = await hashPassword(password);

      if (inputHash !== data.passwordHash) {
        setError("パスワードが正しくありません。");
        setLoading(false);
        return;
      }

      const user: AuthUser = {
        employeeId: data.employeeId,
        name: data.name,
      };

      // ログイン情報を localStorage に保存
      if (typeof window !== "undefined") {
        localStorage.setItem("maintenanceAppUser", JSON.stringify(user));
      }

      router.push("/menu");
    } catch (err) {
      console.error(err);
      setError("ログインに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>ログイン</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>社員番号（ID）</label>
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

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
