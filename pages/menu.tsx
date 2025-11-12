// pages/menu.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export default function Menu() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [memoText, setMemoText] = useState("");

  // 認証情報（必ずコンポーネントの先頭で呼ぶ）
  const { user, loading, logout } = useAuth();

  // SSR対策：クライアントでレンダーされているか
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ログインしていなければ /login へ
  useEffect(() => {
    if (!isClient) return;
    if (!loading && !user) {
      router.push("/login");
    }
  }, [isClient, loading, user, router]);

  // 日付とメモ取得
  useEffect(() => {
    if (!isClient) return;

    const today = new Date();
    const todayNum = today.getTime();
    setDate(
      `${today.getFullYear()}/${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${today
        .getDate()
        .toString()
        .padStart(2, "0")}`
    );

    const fetchMemo = async () => {
      const snap = await getDocs(collection(db, "memos"));
      const validMemos: string[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const start = new Date(data.startDate).getTime();
        const end = new Date(data.endDate).getTime();

        if (start <= todayNum && todayNum <= end) {
          validMemos.push(data.memo);
        }
      }

      setMemoText(validMemos.join("\n"));
    };

    fetchMemo();
  }, [isClient]);

  // まだクライアントかどうか分からないうちは描画しない
  if (!isClient) {
    return null;
  }

  // 認証確認中
  if (loading || (!user && isClient)) {
    return <div style={{ padding: "40px" }}>認証確認中...</div>;
  }

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 24px",
    margin: "6px 0",
    fontSize: "20px",
    fontWeight: "bold",
    borderRadius: "2px",
    cursor: "pointer",
    border: "none",
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        backgroundColor: "#F2F7FA",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>
          メンテナンス管理システム
        </h1>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "14px", marginBottom: "4px" }}>
            ログイン中：{user?.name}（{user?.employeeId}）
            <button
              style={{
                marginLeft: "12px",
                fontSize: "12px",
                padding: "4px 8px",
                cursor: "pointer",
              }}
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              ログアウト
            </button>
          </div>
          <div
            style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}
          >
            {date}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", marginTop: "20px", gap: "40px" }}>
        <div style={{ flex: 1 }}>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#27A6DA",
              borderBottom: "2px dotted #045D75",
            }}
            onClick={() => router.push("/daily")}
          >
            Dailyメンテナンス
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#27A6DA",
              borderBottom: "2px dotted #045D75",
            }}
            onClick={() => router.push("/weekly")}
          >
            Weeklyメンテナンス
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#27A6DA",
              borderBottom: "2px dotted #045D75",
            }}
            onClick={() => router.push("/monthly")}
          >
            Monthlyメンテナンス
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#27A6DA",
              borderBottom: "2px dotted #045D75",
            }}
            onClick={() => router.push("/quarterly")}
          >
            Quarterlyメンテナンス
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#27A6DA",
              borderBottom: "2px dotted #045D75",
            }}
            onClick={() => router.push("/yearly")}
          >
            Yearlyメンテナンス
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#145E75",
              color: "white",
            }}
            onClick={() => router.push("/maintenance-settings")}
          >
            各メンテナンス設定
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#145E75",
              color: "white",
            }}
            onClick={() => router.push("/memo")}
          >
            メモ
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#145E75",
              color: "white",
            }}
            onClick={() => router.push("/other-settings")}
          >
            その他設定
          </button>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <label
          style={{
            fontWeight: "bold",
            fontSize: "20px",
            color: "#333",
          }}
        >
          memo
        </label>
        <textarea
          style={{
            width: "100%",
            height: "160px",
            border: "4px solid #0D1D2B",
            borderRadius: "20px",
            backgroundColor: "#EAF3F9",
            fontSize: "16px",
            padding: "12px",
          }}
          value={memoText}
          placeholder="ここにメモを記入..."
          readOnly
        />
      </div>
    </div>
  );
}
