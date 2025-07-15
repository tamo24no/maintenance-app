// pages/api/registerUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../firebase/serviceAccountKey.json'; // ← パスは適宜調整

// Firebase Admin SDK の初期化（すでに初期化済みか確認）
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("📩 パスワード登録リクエストを受信しました");

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, employeeId, email, password } = req.body;

  if (!name || !employeeId || !email || !password) {
    console.error('❌ 入力が不足しています', req.body);
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const docRef = db.collection('users').doc(employeeId);
    await docRef.set({
      name,
      employeeId,
      email,
      password, // ※ 実運用では bcrypt 等でハッシュ化を推奨
      createdAt: new Date().toISOString(),
    });

    console.log('✅ Firestore にユーザー情報を登録しました');
    return res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('🔥 登録処理中にエラー:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
