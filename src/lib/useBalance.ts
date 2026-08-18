// 跨页余额订阅 hook
'use client';

import { useEffect, useState } from 'react';
import { getBalance, DEFAULT_BALANCE } from './redeem';

export function useBalance(): number {
  const [balance, setBalance] = useState<number>(DEFAULT_BALANCE);
  useEffect(() => {
    setBalance(getBalance());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number') setBalance(detail);
    };
    window.addEventListener('wb:balance:change', onChange as EventListener);
    return () => window.removeEventListener('wb:balance:change', onChange as EventListener);
  }, []);
  return balance;
}
