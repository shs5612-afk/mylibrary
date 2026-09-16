'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Key, 
  Save, 
  Download, 
  Upload, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { 
  getStoredProfile, 
  saveStoredProfile, 
  getStoredApiKey, 
  saveStoredApiKey,
  exportMyLibraryBackup,
  importMyLibraryBackup
} from '@/lib/db';
import { PersonalProfile } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function SettingsPage() {
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setProfile(getStoredProfile());
    setApiKey(getStoredApiKey());
  }, []);

  if (!profile) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredProfile(profile);
    saveStoredApiKey(apiKey);
    confetti({ particleCount: 50, spread: 60 });
    setToastMessage('나만의 서재 설정이 성공적으로 저장되었습니다!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const ok = importMyLibraryBackup(event.target?.result as string);
        if (ok) {
          alert('내 서재 데이터가 성공적으로 복원되었습니다!');
          window.location.reload();
        } else {
          alert('올바르지 않은 백업 파일 형식입니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-500" />
            <span>나만의 서재 맞춤 설정</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            서재 이름, 나의 좌우명, 아바타 및 Google AI API 키를 설정합니다.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">내 서재 브랜딩</h2>
              <p className="text-xs text-slate-500">화면 상단과 성장 트리에 표시될 정보입니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">내 이름 / 필명 *</label>
              <input
                type="text"
                required
                value={profile.ownerName}
                onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                placeholder="예: 서현상"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">서재 명칭 *</label>
              <input
                type="text"
                required
                value={profile.libraryTitle}
                onChange={(e) => setProfile({ ...profile, libraryTitle: e.target.value })}
                placeholder="예: 자이당"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">나의 독서 좌우명</label>
              <input
                type="text"
                value={profile.motto}
                onChange={(e) => setProfile({ ...profile, motto: e.target.value })}
                placeholder="예: 내꿈을 실현하는 행복한 인생 ✨"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">대표 아바타 이모지</label>
              <select
                value={profile.avatarEmoji}
                onChange={(e) => setProfile({ ...profile, avatarEmoji: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="🦊">🦊 영리한 여우</option>
                <option value="🦉">🦉 지혜로운 올빼미</option>
                <option value="🦁">🦁 용감한 사자</option>
                <option value="🚀">🚀 우주 탐험가</option>
                <option value="🌱">🌱 지혜의 새싹</option>
                <option value="🌙">🌙 밤하늘 꿈별</option>
                <option value="📚">📚 북마스터</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gemini API Key Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Gemini API Key 연동</h2>
              <p className="text-xs text-slate-500">1:1 AI 티키타카 및 메타데이터 자동 작성을 위한 무료 키입니다.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>입력한 키는 노트북 브라우저 로컬 저장소에만 안전하게 보관됩니다.</span>
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
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>설정 저장하기</span>
          </button>
        </div>

      </form>

      {/* Backup & Restore Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold bg-white/10 px-2 py-0.5 rounded-full">
            데이터 영구 보관 & 기기 이동
          </span>
          <h3 className="text-lg font-black mt-1">내 서재 전체 백업 및 복원 (JSON)</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            내 소장 도서, 완독 기록, AI 생각노트 전체를 파일로 다운로드하여 다른 노트북이나 PC로 손쉽게 옮길 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={exportMyLibraryBackup}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>내 서재 전체 백업 다운로드 (.json)</span>
          </button>

          <label className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-white/20">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>백업 파일 복원하기</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

    </div>
  );
}
