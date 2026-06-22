'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useIsB2b() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const checkB2b = () => {
        if (typeof window !== 'undefined') {
            if (window.location.hostname.includes('localhost') || 
                window.location.hostname.includes('127.0.0.1') ||
                window.location.hostname.startsWith('192.168.')) {
                return pathname?.startsWith('/b2b') || false;
            }
            return window.location.hostname.includes('partner') || 
                   window.location.hostname.includes('b2b') || 
                   window.location.hostname.includes('bugoon') ||
                   pathname?.startsWith('/b2b') || 
                   false;
        }
        return pathname?.startsWith('/b2b') || false;
    };

    return mounted ? checkB2b() : false;
}
