import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
sgMail.setApiKey(SENDGRID_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("📩 送信リクエストを受信しました");
  if (req.method !== 'POST') return res.status(405).end();

  const { name, employeeId, email } = req.body;

  if (!name || !employeeId || !email) {
    console.error('❌ 入力が不足しています', { name, employeeId, email });
    return res.status(400).json({ message: 'Missing fields' });
  }

  const setupUrl = `${BASE_URL}/password-setup?name=${encodeURIComponent(name)}&employeeId=${encodeURIComponent(employeeId)}&email=${encodeURIComponent(email)}`;

  const msg = {
    to: email,
    from: 'oide564266yokka@gmail.com', // ✅ 認証済みアドレス
    subject: '【メンテナンス管理】パスワード設定のお願い',
    html: `
      <p>${name}様、こんにちは。</p>
      <p>以下のリンクより、パスワードの設定を行ってください。</p>
      <a href="${setupUrl}">パスワード設定はこちら</a>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ メール送信成功');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ メール送信失敗', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
}
