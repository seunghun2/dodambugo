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
            const hostname = window.location.hostname;
            const port = window.location.port;

            if (hostname.includes('localhost') || 
                hostname.includes('127.0.0.1') ||
                hostname.startsWith('192.168.')) {
                return port === '3001' || pathname?.startsWith('/b2b') || false;
            }
            return hostname.includes('partner') || 
                   hostname.includes('b2b') || 
                   hostname.includes('bugoon') ||
                   pathname?.startsWith('/b2b') || 
                   false;
        }
        return pathname?.startsWith('/b2b') || false;
    };

    return mounted ? checkB2b() : false;
}
