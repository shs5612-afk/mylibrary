'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Sparkles, 
  Bookmark, 
  BarChart3, 
  Settings, 
  PlusCircle, 
  Key,
  X,
  Check
} from 'lucide-react';
import { getStoredProfile, getStoredApiKey, saveStoredApiKey } from '@/lib/db';
import { PersonalProfile } from '@/lib/types';
import AddBookModal from '@/components/AddBookModal';

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => {
    setProfile(getStoredProfile());
    setApiKeyInput(getStoredApiKey());
  }, [pathname]);

  const handleSaveApiKey = () => {
    saveStoredApiKey(apiKeyInput.trim());
    setApiKeySaved(true);
    setTimeout(() => {
      setApiKeySaved(false);
      setIsApiModalOpen(false);
    }, 1200);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo / Library Name */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform text-lg">
                  {profile?.avatarEmoji || '🌱'}
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-slate-900 via-amber-900 to-rose-900 bg-clip-text text-transparent">
                    {profile?.libraryTitle || '자이당'}
                  </span>
                  <span className="hidden sm:inline-block ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    서현상의 프라이빗 서재
                  </span>
                </div>
              </Link>
            </div>

            {/* Main Menu Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link
                href="/"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  pathname === '/'
                    ? 'bg-amber-50 text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>내 책장</span>
              </Link>

              <Link
                href="/journal"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  pathname.startsWith('/journal')
                    ? 'bg-amber-50 text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-4 h-4 text-amber-600" />
                <span>AI 생각노트</span>
              </Link>

              <Link
                href="/stats"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  pathname.startsWith('/stats')
                    ? 'bg-amber-50 text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>독서 성장 & 통계</span>
              </Link>

              <Link
                href="/settings"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  pathname.startsWith('/settings')
                    ? 'bg-amber-50 text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-600" />
                <span>서재 설정</span>
              </Link>
            </nav>

            {/* Right Action: + Book Register Button & API Key */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ 내 책 등록</span>
              </button>

              <button
                type="button"
                onClick={() => setIsApiModalOpen(true)}
                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-xl text-xs flex items-center gap-1 transition"
                title="Google AI Studio Key 설정"
              >
                <Key className="w-4 h-4 text-amber-500" />
                <span className="hidden lg:inline text-slate-600 text-xs font-semibold">AI 설정</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 bg-white text-xs font-bold">
          <Link href="/" className={`flex flex-col items-center py-1 ${pathname === '/' ? 'text-amber-600' : 'text-slate-600'}`}>
            <BookOpen className="w-4 h-4" />
            <span>내책장</span>
          </Link>
          <Link href="/journal" className={`flex flex-col items-center py-1 ${pathname.startsWith('/journal') ? 'text-amber-600' : 'text-slate-600'}`}>
            <Bookmark className="w-4 h-4" />
            <span>생각노트</span>
          </Link>
          <Link href="/stats" className={`flex flex-col items-center py-1 ${pathname.startsWith('/stats') ? 'text-amber-600' : 'text-slate-600'}`}>
            <BarChart3 className="w-4 h-4" />
            <span>성장통계</span>
          </Link>
          <Link href="/settings" className={`flex flex-col items-center py-1 ${pathname.startsWith('/settings') ? 'text-amber-600' : 'text-slate-600'}`}>
            <Settings className="w-4 h-4" />
            <span>설정</span>
          </Link>
        </div>
      </header>

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => {
          setIsAddModalOpen(false);
          window.location.reload();
        }}
      />

      {/* Gemini API Key Modal */}
      {isApiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                Google AI Studio API Key 설정
              </h3>
              <button onClick={() => setIsApiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Google AI Studio의 무료 Gemini API 키를 입력하시면 <strong>Gemini 3.6 Flash / 3.5 Flash</strong> 등 최신 플래시 모델이 우선적으로 연결되어 책에 대한 1:1 심층 티키타카와 감상 토론을 진행합니다.
            </p>

            <div className="space-y-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>입력한 키는 노트북 브라우저에만 안전하게 보관됩니다.</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 hover:underline font-bold"
                >
                  무료 키 발급 ↗
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsApiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition flex items-center gap-1.5"
              >
                {apiKeySaved ? <Check className="w-4 h-4" /> : null}
                <span>{apiKeySaved ? '저장 완료!' : '키 저장하기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
