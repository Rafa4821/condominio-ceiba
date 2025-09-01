'use client'; // Necesario para usar hooks de cliente como redirect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/periodos-cobro');
  }, [router]);

  return null; // No se renderiza nada, solo se redirige
}

