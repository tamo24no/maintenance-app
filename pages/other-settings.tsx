// pages/other-settings.tsx
import type React from "react";
import { useRouter } from "next/router";

const OtherSettings: React.FC = () => {
  const router = useRouter();

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "20px",
    margin: "10px 0",
    backgroundColor: "#1A6583",
    color: "white",
    fontSize: "24px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "2px",
    cursor: "pointer",
    textAlign: "left",
  };

  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: "#F2F7FA",
        height: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "36px",
          fontWeight: "bold",
          marginBottom: "30px",
        }}
      >
        その他設定
      </h1>

      {/* アカウント追加ページへ遷移 */}
      <button
        style={buttonStyle}
        onClick={() => router.push("/account-add")}
      >
        アカウントの追加
      </button>

      {/* （将来用）アカウント削除ページへ遷移 */}
      <button
        style={buttonStyle}
        onClick={() => router.push("/account-delete")}
      >
        アカウントの削除
      </button>

      {/* （将来用）アカウント一覧ページへ遷移 */}
      <button
        style={buttonStyle}
        onClick={() => router.push("/account-list")}
      >
        アカウント一覧
      </button>
    </div>
  );
};

export default OtherSettings;
