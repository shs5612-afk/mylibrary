'use client';

import { PersonalBook, SavedThought, PersonalProfile, ReadingStatus } from './types';
import { INITIAL_BOOKS, INITIAL_PROFILE } from '../data/sampleBooks';

const STORAGE_KEYS = {
  BOOKS: 'mylib_books_v1',
  PROFILE: 'mylib_profile_v2',
  THOUGHTS: 'mylib_thoughts_v1',
  API_KEY: 'mylib_gemini_api_key',
};

// 1. Profile Storage
export const getStoredProfile = (): PersonalProfile => {
  if (typeof window === 'undefined') return INITIAL_PROFILE;
  const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!saved) {
    // Check if there was an old profile that wasn't the old sample
    const oldSaved = localStorage.getItem('mylib_profile_v1');
    if (oldSaved) {
      try {
        const oldParsed = JSON.parse(oldSaved);
        if (oldParsed.ownerName && oldParsed.ownerName !== '김민준') {
          const merged = { ...INITIAL_PROFILE, ...oldParsed };
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(merged));
          return merged;
        }
      } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
    return INITIAL_PROFILE;
  }
  try {
    const parsed = JSON.parse(saved);
    if (parsed.ownerName === '김민준') {
      const updated = { ...parsed, ...INITIAL_PROFILE };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      return updated;
    }
    return { ...INITIAL_PROFILE, ...parsed };
  } catch (e) {
    return INITIAL_PROFILE;
  }
};

export const saveStoredProfile = (profile: PersonalProfile) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

// 2. Personal Books Storage
export const getStoredPersonalBooks = (): PersonalBook[] => {
  if (typeof window === 'undefined') return INITIAL_BOOKS;
  const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    return INITIAL_BOOKS;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return INITIAL_BOOKS;
  }
};

export const saveStoredPersonalBook = (book: PersonalBook): PersonalBook[] => {
  const list = getStoredPersonalBooks();
  const index = list.findIndex((b) => b.id === book.id);
  let updated: PersonalBook[];
  if (index !== -1) {
    updated = [...list];
    updated[index] = book;
  } else {
    updated = [book, ...list];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(updated));
  }
  return updated;
};

export const deleteStoredPersonalBook = (id: string): PersonalBook[] => {
  const list = getStoredPersonalBooks();
  const updated = list.filter((b) => b.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(updated));
  }
  return updated;
};

export const updateBookReadingStatus = (
  id: string,
  newStatus: ReadingStatus,
  extra?: { rating?: number; reviewText?: string; progressPercent?: number }
): PersonalBook | null => {
  const list = getStoredPersonalBooks();
  const index = list.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;

  const current = list[index];
  const updated: PersonalBook = {
    ...current,
    readingStatus: newStatus,
    progressPercent: newStatus === 'completed' ? 100 : extra?.progressPercent ?? current.progressPercent,
    rating: extra?.rating ?? current.rating,
    reviewText: extra?.reviewText ?? current.reviewText,
    completedAt: newStatus === 'completed' ? (current.completedAt || todayStr) : current.completedAt,
    startedAt: newStatus === 'reading' && !current.startedAt ? todayStr : current.startedAt,
  };

  list[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(list));
    
    // Reward points for completion
    if (newStatus === 'completed' && current.readingStatus !== 'completed') {
      const prof = getStoredProfile();
      prof.totalCompleted += 1;
      prof.readingPoints += 50;
      prof.level = Math.min(10, Math.floor(prof.readingPoints / 100) + 1);
      saveStoredProfile(prof);
    }
  }
  return updated;
};

// 3. Saved AI Thoughts & Dialogues (Scrap Notes)
export const getStoredThoughts = (): SavedThought[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEYS.THOUGHTS);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
};

export const saveStoredThought = (
  item: Omit<SavedThought, 'id' | 'savedAt'>
): SavedThought => {
  const list = getStoredThoughts();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedDate = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const newThought: SavedThought = {
    ...item,
    id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    savedAt: formattedDate,
  };

  const updated = [newThought, ...list];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.THOUGHTS, JSON.stringify(updated));
  }
  return newThought;
};

export const deleteStoredThought = (id: string): SavedThought[] => {
  const list = getStoredThoughts();
  const updated = list.filter((t) => t.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.THOUGHTS, JSON.stringify(updated));
  }
  return updated;
};

// 4. API Key Storage
export const getStoredApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
};

export const saveStoredApiKey = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
};

// 5. Full Private Backup & Restore
export const exportMyLibraryBackup = () => {
  const data = {
    profile: getStoredProfile(),
    books: getStoredPersonalBooks(),
    thoughts: getStoredThoughts(),
    apiKey: getStoredApiKey(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-ai-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importMyLibraryBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.profile) saveStoredProfile(data.profile);
    if (data.books) localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(data.books));
    if (data.thoughts) localStorage.setItem(STORAGE_KEYS.THOUGHTS, JSON.stringify(data.thoughts));
    if (data.apiKey) saveStoredApiKey(data.apiKey);
    return true;
  } catch (e) {
    console.error('Backup import error:', e);
    return false;
  }
};
