//pages/api/login.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../firebase/serviceAccountKey.json';

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { employeeId, password } = req.body;

  console.log("🔐 ログイン試行:", { employeeId, password });

  if (!employeeId || !password) {
    return res.status(400).json({ message: '社員番号またはパスワードが未入力です' });
  }

  try {
    const docRef = db.collection('users').doc(employeeId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'ログインIDが見つかりません' });
    }

    const userData = docSnap.data();
    if (userData?.password !== password) {
      return res.status(401).json({ message: 'パスワードが正しくありません' });
    }

    return res.status(200).json({ message: 'ログイン成功', user: userData });
  } catch (error) {
    console.error('❌ ログイン中にエラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
}
