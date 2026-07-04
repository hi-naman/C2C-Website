'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '@/services/forum';
import { useUpload } from '@/hooks/use-upload';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Image as ImageIcon,
  Loader2,
  X,
  Plus,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';


export default function NewForumPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { uploadImage, isUploading } = useUpload();

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Mutation to create post
  const createPostMutation = useMutation({
    mutationFn: forumService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      router.push('/forum');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit post. Please try again.');
    },
  });

  // Handle uploading images directly to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit maximum files to 3
    if (imageUrls.length >= 3) {
      setFormError('You can upload a maximum of 3 images per post.');
      return;
    }

    setFormError(null);
    try {
      const url = await uploadImage(file, 'forum');
      setImageUrls((prev) => [...prev, url]);
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed. Verify credentials and try again.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const addRecommendedTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      const cleanVal = tagInputValue.trim().replace(/,$/, '').toLowerCase();
      if (cleanVal) {
        if (!tags.includes(cleanVal)) {
          setTags((prev) => [...prev, cleanVal]);
        }
        setTagInputValue('');
      }
    } else if (e.key === 'Backspace' && tagInputValue === '') {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate inputs
    if (!title.trim() || title.trim().length < 5) {
      setFormError('Title must be at least 5 characters long.');
      return;
    }

    // Strip HTML tags to validate actual content length
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    if (!cleanContent || cleanContent.length < 10) {
      setFormError('Post content must be at least 10 characters long.');
      return;
    }

    // Flush any typed tag value still in input before submission
    let finalTags = [...tags];
    const cleanVal = tagInputValue.trim().toLowerCase();
    if (cleanVal && !finalTags.includes(cleanVal)) {
      finalTags.push(cleanVal);
    }

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      tags: finalTags,
      imageUrls,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to discussions
      </Link>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Launch a Discussion</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Share tips, reference links, and code insights. Supports rich formatting and checklists.
        </p>
      </div>

      {formError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-mono">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{formError}</p>
        </div>
      )}

      {/* Main Creation Card Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-xs font-mono font-semibold uppercase text-muted-foreground/80">
            Topic Title
          </label>
          <Input
            id="title"
            type="text"
            placeholder="e.g. Tips for solving HackerRank Grid Challenges"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-background border-border focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent/50 rounded-xl"
            required
            maxLength={100}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="tags-input" className="text-xs font-mono font-semibold uppercase text-muted-foreground/80">
            Tags (Press Enter, comma, or Tab to add)
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2 bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-brand-accent/20 focus-within:border-brand-accent/50 transition-all min-h-11">
            {tags.map((tag, i) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 text-xs font-mono border border-border/80 bg-muted/30 pl-2.5 pr-1.5 py-0.5 rounded-lg text-foreground transition-all duration-200"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 p-0.5 rounded-md transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <input
              id="tags-input"
              type="text"
              placeholder={tags.length === 0 ? "e.g. algorithms, hackerrank, interview" : ""}
              value={tagInputValue}
              onChange={(e) => setTagInputValue(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="bg-transparent border-0 ring-0 outline-none flex-1 min-w-[120px] text-sm text-foreground placeholder:text-muted-foreground/60 h-7"
            />
          </div>

          {/* Recommended tags suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 mt-1 px-1">
            <span>Recommended:</span>
            {['algorithms', 'hackerrank', 'interview', 'webdev', 'career', 'questions', 'tips'].map((recTag) => {
              const isAdded = tags.includes(recTag);
              return (
                <button
                  key={recTag}
                  type="button"
                  disabled={isAdded}
                  onClick={() => addRecommendedTag(recTag)}
                  className={cn(
                    "border rounded px-2 py-0.5 transition-all duration-150",
                    isAdded
                      ? "border-border/40 text-muted-foreground/40 bg-muted/5 cursor-not-allowed"
                      : "hover:text-foreground hover:border-foreground/15 border-border/60 bg-muted/10 hover:bg-muted/25"
                  )}
                >
                  #{recTag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rich Text Editor Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold uppercase text-muted-foreground/80">
              Body Message
            </label>
            <span className="text-[10px] font-mono text-muted-foreground/60">Rich Text Editor</span>
          </div>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your discussion details here... Use the toolbar or keyboard shortcuts to format. Drag & drop images directly!"
          />
        </div>

        {/* Image Attachment Upload Component */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-semibold uppercase text-muted-foreground/80 block">
            Attach Images (Max 3)
          </span>

          <div className="flex flex-wrap items-center gap-4">
            {/* Upload trigger box */}
            {imageUrls.length < 3 && (
              <label
                className={cn(
                  'h-24 w-24 rounded-xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 hover:border-brand-accent/30 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer select-none',
                  isUploading && 'pointer-events-none opacity-50'
                )}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-brand-accent animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5 text-muted-foreground mb-1.5" />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}

            {/* Thumbnail previews */}
            {imageUrls.map((url, i) => (
              <div
                key={i}
                className="h-24 w-24 relative rounded-xl border border-border bg-muted/45 overflow-hidden group shadow-inner animate-fade-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-black/85 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          <Button
            type="submit"
            disabled={createPostMutation.isPending || isUploading}
            className="bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-200 px-6 rounded-xl font-medium"
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Discussion'
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={createPostMutation.isPending || isUploading}
            onClick={() => router.push('/forum')}
            className="border-border hover:bg-muted rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>

  );
}
