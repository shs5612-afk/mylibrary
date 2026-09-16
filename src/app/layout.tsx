import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: '자이당 - 서현상의 AI 서재 & 독서 연구소',
  description: '서현상 님의 자이당 · 내꿈을 실현하는 행복한 인생을 위한 1인 1도서관 AI 서재',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>🛋️ <strong>1인 1도서관 프로젝트</strong> · 나만의 프라이빗 AI 서재</span>
            <span className="text-slate-400">데이터는 당신의 노트북에 100% 안전하게 저장됩니다 (서버비 0원)</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
