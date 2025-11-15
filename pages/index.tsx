// pages/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // トップに来たら /login にリダイレクト
  }, [router]);

  return null;
}
