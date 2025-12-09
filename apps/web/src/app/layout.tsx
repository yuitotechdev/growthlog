import './globals.css';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'GrowthLog - 成長記録アプリ',
  description: '日々の活動を記録し、AIフィードバックで成長を加速させましょう',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <NavBar />
        <main className="main-container">
          {children}
        </main>
      </body>
    </html>
  );
}


