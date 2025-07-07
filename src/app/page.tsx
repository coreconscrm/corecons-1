'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuario está conectado, redirigir al panel de control.
        router.replace('/dashboard');
      } else {
        // Usuario no está conectado, redirigir a la página de inicio de sesión.
        router.replace('/login');
      }
    });

    // Limpiar el listener cuando el componente se desmonte.
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
