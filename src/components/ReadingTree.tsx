'use client';

import { PersonalProfile } from '@/lib/types';
import { Sparkles, Trophy, Flame } from 'lucide-react';

interface ReadingTreeProps {
  profile: PersonalProfile;
}

export default function ReadingTree({ profile }: ReadingTreeProps) {
  const getStage = (count: number) => {
    if (count === 0) return { stage: '새싹 단계', icon: '🌱', desc: '첫 완독을 향해 힘차게 출발해 보세요!', color: 'from-emerald-400 to-green-600' };
    if (count <= 3) return { stage: '어린 나무 단계', icon: '🌿', desc: '지혜의 잎사귀가 돋아나고 있어요!', color: 'from-green-500 to-emerald-700' };
    if (count <= 7) return { stage: '무성한 숲 단계', icon: '🌳', desc: '깊은 생각의 뿌리가 튼튼해졌어요!', color: 'from-teal-500 to-emerald-800' };
    if (count <= 15) return { stage: '꽃피는 나무 단계', icon: '🌸', desc: '눈부신 독서의 꽃이 활짝 피었습니다!', color: 'from-pink-500 to-rose-600' };
    return { stage: '황금빛 지혜의 거목', icon: '👑', desc: '자신만의 깊은 세계관을 완성한 독서 대가!', color: 'from-amber-400 to-yellow-600' };
  };

  const treeInfo = getStage(profile.totalCompleted);

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        
        {/* Left: Tree & Stage info */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white shadow-md border border-amber-200 flex items-center justify-center text-3xl sm:text-4xl shrink-0">
            {treeInfo.icon}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Lv.{profile.level} {treeInfo.stage}
              </span>
              <span className="text-xs font-bold text-slate-500">
                총 {profile.totalCompleted}권 완독 달성
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {profile.ownerName} 님의 {profile.libraryTitle}
            </h2>

            <p className="text-xs text-slate-600 italic">
              "{profile.motto}"
            </p>
          </div>
        </div>

        {/* Right: Stats badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-amber-200 text-center min-w-[90px]">
            <div className="text-[10px] text-slate-500 font-bold">누적 완독</div>
            <div className="text-lg sm:text-xl font-black text-amber-600 mt-0.5">
              {profile.totalCompleted} <span className="text-xs text-slate-500 font-normal">권</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-amber-200 text-center min-w-[90px]">
            <div className="text-[10px] text-slate-500 font-bold">독서 포인트</div>
            <div className="text-lg sm:text-xl font-black text-orange-600 mt-0.5">
              {profile.readingPoints} <span className="text-xs text-slate-500 font-normal">P</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
