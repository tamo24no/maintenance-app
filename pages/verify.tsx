// pages/verify.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const Verify = () => {
  const router = useRouter();

  useEffect(() => {
    const email = window.localStorage.getItem('emailForSignIn');
    if (email && isSignInWithEmailLink(auth, window.location.href)) {
      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          router.push('/menu'); // 今後作成するメニュー画面へ遷移
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, []);

  return <p>ログイン処理中です...</p>;
};

export default Verify;
