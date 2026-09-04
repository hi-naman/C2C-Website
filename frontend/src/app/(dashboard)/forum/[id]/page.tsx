'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '@/services/forum';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Markdown } from '@/components/shared/markdown';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  Trash2,
  Send,
  ArrowLeft,
  Clock,
  AlertCircle,
  Tag,
  Loader2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';


export default function ForumPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const id = params.id as string;

  const [commentText, setCommentText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline post editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');


  // Fetch detailed post thread
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['forum-post', id],
    queryFn: () => forumService.getPostById(id),
    staleTime: 1000 * 30, // 30 seconds stale cache
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: () => forumService.toggleUpvote(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['forum-post', id] });
      const previousPost = queryClient.getQueryData<any>(['forum-post', id]);

      if (previousPost) {
        const currentlyUpvoted = previousPost.hasUpvoted ?? false;
        queryClient.setQueryData(['forum-post', id], {
          ...previousPost,
          hasUpvoted: !currentlyUpvoted,
          upvoteCount: currentlyUpvoted ? previousPost.upvoteCount - 1 : previousPost.upvoteCount + 1,
        });
      }

      return { previousPost };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['forum-post', id], context.previousPost);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  // Pin mutation (Admin only)
  const togglePinMutation = useMutation({
    mutationFn: () => forumService.togglePinPost(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['forum-post', id] });
      const previousPost = queryClient.getQueryData<any>(['forum-post', id]);

      if (previousPost) {
        queryClient.setQueryData(['forum-post', id], {
          ...previousPost,
          isPinned: !previousPost.isPinned,
        });
      }

      return { previousPost };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['forum-post', id], context.previousPost);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: () => forumService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      router.push('/forum');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to delete post.');
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (content: string) => forumService.createComment(id, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to post comment.');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => forumService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to delete comment.');
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: (payload: { title: string; content: string; tags: string[] }) =>
      forumService.updatePost(id, payload),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['forum-post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update post.');
    },
  });

  const startEditing = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditTagsInput(post.tags?.join(', ') || '');
    setIsEditing(false); // set to false first, let state clear then open
    setTimeout(() => setIsEditing(true), 0);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editTitle.trim() || editTitle.trim().length < 5) {
      setFormError('Title must be at least 5 characters long.');
      return;
    }

    const cleanContent = editContent.replace(/<[^>]*>/g, '').trim();
    if (!cleanContent || cleanContent.length < 10) {
      setFormError('Post content must be at least 10 characters long.');
      return;
    }

    const tags = editTagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    updatePostMutation.mutate({
      title: editTitle.trim(),
      content: editContent,
      tags,
    });
  };


  const handleUpvote = () => {
    upvoteMutation.mutate();
  };

  const handleDeletePost = () => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    deletePostMutation.mutate();
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!commentText.trim()) return;

    createCommentMutation.mutate(commentText.trim());
  };

  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    deleteCommentMutation.mutate(commentId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <div className="rounded-xl border border-border p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-2 pt-4 border-t border-border">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to discussions
        </Link>
        <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
          Failed to load discussion details. This post may have been deleted or moved.
        </div>
      </div>
    );
  }

  const isPostAuthor = user?.id === post.authorId;
  const isAuthorizedToDeletePost = isPostAuthor || user?.role === 'ADMIN' || user?.role === 'SENIOR';
  const isUserUpvoted = post.hasUpvoted ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back navigation */}
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to discussions
      </Link>

      {formError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-mono">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{formError}</p>
        </div>
      )}

      {isEditing ? (
        /* Edit Form mode */
        <form onSubmit={handleEditSave} className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground/80">
              Edit Discussion Thread
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Edit Title */}
          <div className="space-y-2">
            <label htmlFor="edit-title" className="text-xs font-mono font-semibold uppercase text-muted-foreground/80">
              Topic Title
            </label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Tips for solving HackerRank Grid Challenges"
              className="bg-background border-border focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent/50 rounded-xl"
              required
              maxLength={100}
            />
          </div>

          {/* Edit Tags */}
          <div className="space-y-2">
            <label htmlFor="edit-tags" className="text-xs font-mono font-semibold uppercase text-muted-foreground/80">
              Tags (Comma-separated)
            </label>
            <Input
              id="edit-tags"
              value={editTagsInput}
              onChange={(e) => setEditTagsInput(e.target.value)}
              placeholder="e.g. algorithms, hackerrank, interview"
              className="bg-background border-border focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent/50 font-mono text-sm rounded-xl"
            />
          </div>

          {/* Edit content body */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold uppercase text-muted-foreground/80">
              Discussion Content
            </label>
            <TiptapEditor
              content={editContent}
              onChange={setEditContent}
              placeholder="Update your discussion details here..."
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <Button
              type="submit"
              disabled={updatePostMutation.isPending}
              className="bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-200 px-6 rounded-xl font-medium flex items-center gap-2 h-10"
            >
              {updatePostMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={updatePostMutation.isPending}
              onClick={() => setIsEditing(false)}
              className="border-border hover:bg-muted rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        /* Normal Post view */
        <article className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs animate-fade-in">
          {/* Post Metadata Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              {post.author?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="h-10 w-10 rounded-full border border-border"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm text-muted-foreground">
                  {post.author?.name?.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{post.author?.name}</span>
                  <span className="text-[9px] font-mono bg-secondary border border-border/80 px-1.5 py-0.5 rounded text-muted-foreground uppercase font-bold">
                    {post.author?.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mt-0.5 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {user?.role === 'ADMIN' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePinMutation.mutate()}
                  disabled={togglePinMutation.isPending}
                  className={cn(
                    "h-8 px-2.5 text-[10px] font-mono font-bold rounded-lg border flex items-center gap-1.5 transition-all duration-200",
                    post.isPinned
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                      : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                  title={post.isPinned ? "Unpin post" : "Pin post"}
                >
                  <Pin className={cn("h-3.5 w-3.5", post.isPinned && "fill-amber-500")} />
                  <span>{post.isPinned ? "PINNED" : "PIN POST"}</span>
                </Button>
              ) : post.isPinned ? (
                <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-md text-[10px] font-mono font-bold">
                  <Pin className="h-3 w-3 fill-amber-500" />
                  PINNED
                </span>
              ) : null}

              {isPostAuthor && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startEditing}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/40 h-8 w-8 rounded-lg"
                  title="Edit Post"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}

              {isAuthorizedToDeletePost && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeletePost}
                  disabled={deletePostMutation.isPending}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
                  title="Delete Post"
                >
                  {deletePostMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Title & Body content */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{post.title}</h2>

            <div className="max-w-none">
              <Markdown content={post.content} />
            </div>

            {/* Attached image preview panel */}
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 pt-4 border-t border-border/40">
                {post.imageUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-border hover:border-brand-accent/30 hover:scale-[1.01] transition-all duration-200 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Post image ${i + 1}`} className="w-full h-40 object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Action upvote control & tags list */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40">
            <div className="flex flex-wrap gap-1.5">
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] font-mono border border-border bg-muted/40 px-2.5 py-0.5 rounded text-muted-foreground/90 font-medium"
                >
                  <Tag className="h-3 w-3 text-muted-foreground/60" />
                  #{tag}
                </span>
              ))}
            </div>

            <button
              onClick={handleUpvote}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono text-xs transition-all duration-200 font-medium',
                isUserUpvoted
                  ? 'bg-brand-accent/15 text-brand-accent border-brand-accent/25 hover:bg-brand-accent/25'
                  : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <ThumbsUp className={cn('h-4 w-4', isUserUpvoted && 'fill-brand-accent text-brand-accent')} />
              <span>{post.upvoteCount} Upvotes</span>
            </button>
          </div>
        </article>
      )}

      {/* Discussion Comments Thread */}
      <section className="space-y-6">
        <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-foreground flex items-center gap-2 px-1">
          <MessageSquare className="h-4 w-4 text-brand-accent" />
          Comments Thread ({post.comments?.length || 0})
        </h3>

        {/* Comment Editor form */}
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <Textarea
            placeholder="Contribute to this discussion... Share links, formatting, or helpful summaries."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="bg-card border-border focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent/50 rounded-xl min-h-[90px] shadow-xs text-sm"
            required
          />
          <Button
            type="submit"
            disabled={createCommentMutation.isPending || !commentText.trim()}
            className="bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 rounded-xl h-10 px-5 font-medium"
          >
            {createCommentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Comment
              </>
            )}
          </Button>
        </form>

        {/* Comments timeline list */}
        {(!post.comments || post.comments.length === 0) ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border/80 bg-card/25 text-xs text-muted-foreground shadow-xs">
            No comments yet. Share your thoughts above!
          </div>
        ) : (
          <div className="space-y-4">
            {post.comments.map((comment) => {
              const isCommentAuthor = user?.id === comment.authorId;
              const isAuthorizedToDeleteComment = isCommentAuthor || user?.role === 'ADMIN' || user?.role === 'SENIOR';

              return (
                <div
                  key={comment.id}
                  className="rounded-xl border border-border bg-card p-5 space-y-3 flex gap-4 shadow-xs animate-fade-in"
                >
                  {/* Left Avatar */}
                  <div className="shrink-0">
                    {comment.author?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.author.avatarUrl}
                        alt={comment.author.name}
                        className="h-8 w-8 rounded-full border border-border"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">
                        {comment.author?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Right comment content container */}
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Header bar */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">{comment.author?.name}</span>
                        <span className="text-[8px] font-mono bg-secondary border border-border px-1.5 py-0 rounded text-muted-foreground uppercase font-bold shrink-0">
                          {comment.author?.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground/80">{formatDate(comment.createdAt)}</span>
                        
                        {isAuthorizedToDeleteComment && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6 rounded-md"
                            title="Delete Comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

