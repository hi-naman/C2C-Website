'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '@/services/forum';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { useForumDrafts } from '@/hooks/use-forum-drafts';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  Plus,
  Search,
  Clock,
  ChevronDown,
  X,
  FileText,
  User,
  Trash2,
  Edit3,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const POPULAR_TOPICS = ['interview', 'resume', 'dsa', 'career', 'tips', 'questions', 'webdev', 'algorithms'];

export default function ForumFeedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { drafts, deleteDraft } = useForumDrafts();

  // Navigation / View modes
  const [viewMode, setViewMode] = useState<'ALL' | 'MY_POSTS'>('ALL');
  const [mySubTab, setMySubTab] = useState<'PUBLISHED' | 'DRAFTS'>('PUBLISHED');

  // Search, Tags & Sorting
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'upvotes' | 'comments'>('latest');

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch all posts (filtering done client-side)
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['forum-posts'],
    queryFn: () => forumService.getAllPosts(undefined),
    staleTime: 1000 * 30,
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: (id: string) => forumService.toggleUpvote(id),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['forum-posts'] });
      const previousPosts = queryClient.getQueryData<any[]>(['forum-posts']);

      if (previousPosts) {
        queryClient.setQueryData(
          ['forum-posts'],
          previousPosts.map((post) => {
            if (post.id === postId) {
              const currentlyUpvoted = post.hasUpvoted ?? false;
              return {
                ...post,
                hasUpvoted: !currentlyUpvoted,
                upvoteCount: currentlyUpvoted ? post.upvoteCount - 1 : post.upvoteCount + 1,
              };
            }
            return post;
          })
        );
      }

      return { previousPosts };
    },
    onError: (err, postId, context: any) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['forum-posts'], context.previousPosts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  // Pin mutation (Admin only)
  const togglePinMutation = useMutation({
    mutationFn: (id: string) => forumService.togglePinPost(id),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['forum-posts'] });
      const previousPosts = queryClient.getQueryData<any[]>(['forum-posts']);

      if (previousPosts) {
        queryClient.setQueryData(
          ['forum-posts'],
          previousPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isPinned: !post.isPinned,
              };
            }
            return post;
          })
        );
      }

      return { previousPosts };
    },
    onError: (err, postId, context: any) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['forum-posts'], context.previousPosts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  const handleUpvote = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    upvoteMutation.mutate(postId);
  };

  const handleTogglePin = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinMutation.mutate(postId);
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanVal = searchQuery.trim().toLowerCase();
      if (cleanVal) {
        if (!selectedTags.includes(cleanVal)) {
          setSelectedTags((prev) => [...prev, cleanVal]);
        }
        setSearchQuery('');
      }
    } else if (e.key === 'Backspace' && searchQuery === '') {
      setSelectedTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const toggleTag = (tag: string) => {
    const cleanTag = tag.toLowerCase().trim();
    setSelectedTags((prev) =>
      prev.includes(cleanTag)
        ? prev.filter((t) => t !== cleanTag)
        : [...prev, cleanTag]
    );
  };

  // Filter and sort posts based on search query, tags, and sortBy criteria
  const filteredAndSortedPosts = React.useMemo(() => {
    if (!posts) return [];

    let result = posts;

    // Filter by My Posts if active
    if (viewMode === 'MY_POSTS' && user) {
      result = result.filter(
        (post) => post.authorId === user.id || post.author?.email === user.email
      );
    }

    // Filter by tags and search query
    result = result.filter((post) => {
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every((tag) =>
          post.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
        );
        if (!hasAllTags) return false;
      }

      const query = debouncedSearch.toLowerCase().trim();
      if (!query) return true;

      if (query.startsWith('is:pinned')) {
        return post.isPinned;
      }
      if (query.startsWith('author:')) {
        const authorPart = query.substring(7).trim();
        return post.author?.name?.toLowerCase().includes(authorPart);
      }
      if (query.startsWith('tag:')) {
        const tagPart = query.substring(4).trim();
        return post.tags?.some((t) => t.toLowerCase().includes(tagPart));
      }

      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags?.some((t) => t.toLowerCase().includes(query))
      );
    });

    // Sort posts
    result = [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'upvotes') {
        return b.upvoteCount - a.upvoteCount;
      }
      if (sortBy === 'comments') {
        const aCount = a._count?.comments ?? a.commentsCount ?? a.comments?.length ?? 0;
        const bCount = b._count?.comments ?? b.commentsCount ?? b.comments?.length ?? 0;
        return bCount - aCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [posts, viewMode, user, selectedTags, debouncedSearch, sortBy]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Discussions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Exchange interview insights, seek review guidelines, and discuss engineering resources.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start shrink-0">
          <Link
            href="/forum/new"
            className={buttonVariants({
              className: 'bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all font-medium flex items-center gap-2 rounded-xl px-4 py-2 h-10',
            })}
          >
            <Plus className="h-4 w-4" />
            Create Post
          </Link>
        </div>
      </div>

      {/* Mode View Switcher: All Discussions vs My Posts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode('ALL')}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 border",
              viewMode === 'ALL'
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            All Discussions
          </button>

          {user && (
            <button
              onClick={() => setViewMode('MY_POSTS')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 border flex items-center gap-2",
                viewMode === 'MY_POSTS'
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <User className="h-3.5 w-3.5" />
              My Posts
              {drafts.length > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono",
                  viewMode === 'MY_POSTS' ? "bg-background text-foreground" : "bg-primary text-primary-foreground"
                )}>
                  {drafts.length} draft{drafts.length > 1 ? 's' : ''}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Sub-tabs for My Posts view (Published vs Drafts) */}
        {viewMode === 'MY_POSTS' && (
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border self-start sm:self-auto">
            <button
              onClick={() => setMySubTab('PUBLISHED')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                mySubTab === 'PUBLISHED'
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Published
            </button>
            <button
              onClick={() => setMySubTab('DRAFTS')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                mySubTab === 'DRAFTS'
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="h-3 w-3" />
              Drafts ({drafts.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Feed View */}
      <div className="space-y-6">
        {/* Search & Topic Filter Bar (Shown in All Discussions or Published My Posts) */}
        {(viewMode === 'ALL' || (viewMode === 'MY_POSTS' && mySubTab === 'PUBLISHED')) && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Unified Search & Tag Input Box */}
              <div className="flex-1 flex flex-wrap items-center gap-2 p-2 bg-card border border-border rounded-xl focus-within:ring-2 focus-within:ring-brand-accent/20 focus-within:border-brand-accent/50 transition-all min-h-11 shadow-xs">
                <Search className="h-4 w-4 text-muted-foreground/60 ml-2 shrink-0" />
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-xs font-mono border border-border/80 bg-muted/30 pl-2.5 pr-1.5 py-0.5 rounded-lg text-foreground transition-all duration-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 p-0.5 rounded-md transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  enterKeyHint="search"
                  placeholder={selectedTags.length === 0 ? "Search posts or type topic filter and press Enter..." : "Add filter..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="bg-transparent border-0 ring-0 outline-none flex-1 min-w-[150px] text-sm text-foreground placeholder:text-muted-foreground/60 h-7"
                />
              </div>

              {/* Sort Select */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none w-full sm:w-auto bg-card border border-border text-xs font-mono font-semibold tracking-wider rounded-xl pl-3 pr-9 h-11 text-muted-foreground hover:text-foreground hover:border-foreground/15 focus:text-foreground focus-visible:ring-brand-accent/25 focus-visible:border-brand-accent/50 outline-none cursor-pointer shadow-xs transition-all duration-200"
                >
                  <option value="latest">SORT: LATEST</option>
                  <option value="upvotes">SORT: UPVOTES</option>
                  <option value="comments">SORT: COMMENTS</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-muted-foreground/60" />
              </div>
            </div>

            {/* Popular topics list */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 px-1">
              <span>Popular topics:</span>
              {POPULAR_TOPICS.map((topic) => {
                const isSelected = selectedTags.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTag(topic)}
                    className={cn(
                      "border rounded-lg px-2 py-0.5 transition-all duration-150 flex items-center gap-1",
                      isSelected
                        ? "bg-brand-accent/15 border-brand-accent/25 text-brand-accent font-semibold"
                        : "hover:text-foreground hover:border-foreground/15 border-border/60 bg-muted/10 hover:bg-muted/25"
                    )}
                  >
                    #{topic}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DRAFTS VIEW inside My Posts */}
        {viewMode === 'MY_POSTS' && mySubTab === 'DRAFTS' && (
          <div className="space-y-4">
            {drafts.length === 0 ? (
              <div className="text-center p-12 rounded-xl border border-dashed border-border bg-card/20 shadow-xs">
                <FileText className="mx-auto h-9 w-9 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">No Saved Drafts</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Start creating a discussion and any unsaved content will be automatically backed up here.
                </p>
                <Link
                  href="/forum/new"
                  className={cn(buttonVariants({ variant: 'outline' }), "mt-4 h-9 text-xs rounded-xl border-border")}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create Discussion
                </Link>
              </div>
            ) : (
              drafts.map((draft) => {
                const titleText = draft.title.trim() || 'Untitled Draft';
                const snippet = stripHtml(draft.content) || 'No body content typed yet...';

                return (
                  <div
                    key={draft.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-3 hover:border-foreground/20 transition-all duration-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          DRAFT
                        </span>
                        <span>Saved {formatDate(draft.updatedAt)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/forum/new?draftId=${draft.id}`)}
                          className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1 font-mono"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Resume
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDraft(draft.id)}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3
                        onClick={() => router.push(`/forum/new?draftId=${draft.id}`)}
                        className="text-base font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                      >
                        {titleText}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {snippet}
                      </p>
                    </div>

                    {draft.tags && draft.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {draft.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono border border-border bg-muted/40 px-2 py-0.5 rounded text-muted-foreground font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PUBLISHED / ALL FEED VIEW */}
        {(viewMode === 'ALL' || (viewMode === 'MY_POSTS' && mySubTab === 'PUBLISHED')) && (
          <>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border p-6 bg-card space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-3/4 animate-pulse" />
                    <Skeleton className="h-4 w-full animate-pulse" />
                    <div className="flex gap-4 pt-4 border-t border-border/50">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded-xl font-mono">
                Failed to load forum feed. Please try again.
              </div>
            ) : !filteredAndSortedPosts || filteredAndSortedPosts.length === 0 ? (
              <div className="text-center p-16 rounded-xl border border-dashed border-border bg-card/20 shadow-xs animate-fade-in">
                <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <h3 className="mt-4 text-sm font-semibold text-foreground">No Discussions Found</h3>
                <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {viewMode === 'MY_POSTS'
                    ? "You haven't published any discussions yet."
                    : searchQuery || selectedTags.length > 0
                    ? "We couldn't find any threads matching your search or tag criteria."
                    : "Be the first to start a conversation! Submit a forum post above."}
                </p>
                <Link
                  href="/forum/new"
                  className={cn(buttonVariants({ className: 'mt-4 h-9 text-xs rounded-xl font-medium' }))}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create Discussion
                </Link>
              </div>
            ) : (
              /* Forum Threads Feed List */
              <div className="space-y-4">
                {filteredAndSortedPosts.map((post) => {
                  const isUserUpvoted = post.hasUpvoted ?? false;

                  return (
                    <Link
                      key={post.id}
                      href={`/forum/${post.id}`}
                      className="block rounded-xl border border-border bg-card p-6 hover:border-foreground/15 hover:scale-[1.01] transition-all duration-200 shadow-xs"
                    >
                      <div className="space-y-4">
                        {/* Post Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground/80">
                          <div className="flex items-center gap-2">
                            {post.isPinned && (
                              <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                <Pin className="h-3 w-3 fill-amber-500" />
                                PINNED
                              </span>
                            )}
                            <span className="font-semibold text-foreground">{post.author?.name}</span>
                            <span className="text-[9px] bg-secondary border border-border/80 px-1.5 py-0.5 rounded uppercase font-bold">
                              {post.author?.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(post.createdAt)}</span>
                            </div>

                            {user?.role === 'ADMIN' && (
                              <button
                                type="button"
                                onClick={(e) => handleTogglePin(e, post.id)}
                                title={post.isPinned ? "Unpin post" : "Pin post"}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold transition-all duration-200",
                                  post.isPinned
                                    ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                                    : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                )}
                              >
                                <Pin className={cn("h-3 w-3", post.isPinned && "fill-amber-500")} />
                                <span>{post.isPinned ? "Unpin" : "Pin"}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & snippet */}
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-foreground hover:text-brand-accent transition-colors duration-200 line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {stripHtml(post.content)}
                          </p>
                        </div>

                        {/* Bottom stats and tags */}
                        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                          {/* Tags list */}
                          <div className="flex flex-wrap gap-1.5">
                            {post.tags?.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-mono border border-border bg-muted/40 px-2 py-0.5 rounded text-muted-foreground/90 font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Interactive upvote and comment tallies */}
                          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                            <button
                              onClick={(e) => handleUpvote(e, post.id)}
                              className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 text-[11px] font-medium',
                                isUserUpvoted
                                  ? 'bg-brand-accent/15 text-brand-accent border-brand-accent/25 hover:bg-brand-accent/25'
                                  : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <ThumbsUp className={cn('h-3.5 w-3.5', isUserUpvoted && 'fill-brand-accent text-brand-accent')} />
                              <span>{post.upvoteCount}</span>
                            </button>

                            <div className="flex items-center gap-1.5 text-muted-foreground/80 px-1 py-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{post._count?.comments ?? post.commentsCount ?? post.comments?.length ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
