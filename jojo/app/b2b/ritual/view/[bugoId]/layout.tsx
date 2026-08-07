import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: '부고온 - 의례 서식 인쇄',
  description: '위패/축문 A4 서식을 인쇄하실 수 있습니다.',
  openGraph: {
    title: '부고온 - 의례 서식 인쇄',
    description: '위패/축문 A4 서식을 인쇄하실 수 있습니다. 아래 인쇄 버튼을 눌러주세요.',
    siteName: '부고온(BugoON)',
  },
};

export default function RitualViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
