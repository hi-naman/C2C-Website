'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export interface ForumDraft {
  id: string;
  title: string;
  content: string;
  tags: string[];
  imageUrls: string[];
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = 'c2c_forum_drafts_';

export function useForumDrafts() {
  const { user } = useAuth();
  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : `${STORAGE_KEY_PREFIX}guest`;

  const [drafts, setDrafts] = useState<ForumDraft[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load drafts from localStorage
  const loadDrafts = useCallback((): ForumDraft[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  // Sync state on mount or user change
  useEffect(() => {
    setDrafts(loadDrafts());
    setIsLoaded(true);
  }, [loadDrafts]);

  // Save or update a draft
  const saveDraft = useCallback(
    (draftData: { id?: string; title: string; content: string; tags?: string[]; imageUrls?: string[] }): ForumDraft | null => {
      if (typeof window === 'undefined') return null;

      const cleanTitle = draftData.title.trim();
      const cleanContent = draftData.content.replace(/<[^>]*>/g, '').trim();

      // Don't save completely empty drafts
      if (!cleanTitle && !cleanContent && (!draftData.tags || draftData.tags.length === 0) && (!draftData.imageUrls || draftData.imageUrls.length === 0)) {
        return null;
      }

      const existingDrafts = loadDrafts();
      const draftId = draftData.id || `draft_${Date.now()}`;
      const now = new Date().toISOString();

      const newDraft: ForumDraft = {
        id: draftId,
        title: draftData.title,
        content: draftData.content,
        tags: draftData.tags || [],
        imageUrls: draftData.imageUrls || [],
        updatedAt: now,
      };

      const updated = [
        newDraft,
        ...existingDrafts.filter((d) => d.id !== draftId),
      ];

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setDrafts(updated);
        return newDraft;
      } catch (err) {
        console.error('Failed to save draft to localStorage:', err);
        return null;
      }
    },
    [loadDrafts, storageKey]
  );

  // Delete a specific draft
  const deleteDraft = useCallback(
    (id: string) => {
      if (typeof window === 'undefined') return;
      const existing = loadDrafts();
      const updated = existing.filter((d) => d.id !== id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setDrafts(updated);
      } catch (err) {
        console.error('Failed to delete draft:', err);
      }
    },
    [loadDrafts, storageKey]
  );

  // Get a single draft by ID
  const getDraft = useCallback(
    (id: string): ForumDraft | undefined => {
      return loadDrafts().find((d) => d.id === id);
    },
    [loadDrafts]
  );

  // Get the most recently modified draft
  const getLatestDraft = useCallback((): ForumDraft | null => {
    const list = loadDrafts();
    if (list.length === 0) return null;
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }, [loadDrafts]);

  return {
    drafts,
    isLoaded,
    saveDraft,
    deleteDraft,
    getDraft,
    getLatestDraft,
    reloadDrafts: () => setDrafts(loadDrafts()),
  };
}
