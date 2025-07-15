// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ uid: string, name: string, employeeId: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        setUserInfo(null);
        setLoading(false);
      } else {
        const uid = user.uid;
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserInfo({
            uid,
            name: user.displayName || '',
            employeeId: data.employeeId || '',
          });
        } else {
          setUserInfo({ uid, name: user.displayName || '', employeeId: '' });
        }
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  return { loading, userInfo };
}
