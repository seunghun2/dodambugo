'use client';

import React from 'react';

export default function B2BTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ 
        width: '100%', 
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
}
