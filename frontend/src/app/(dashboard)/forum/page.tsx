'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '@/services/forum';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  Plus,
  Hash,
  Search,
  Tag,
  Clock,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForumFeedPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'upvotes' | 'comments'>('latest');

  // Debounce the client-side search query to avoid jitter and rate-limiting triggers
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch posts filtered by the selected tag (backend side filtering)
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['forum-posts', selectedTag],
    queryFn: () => forumService.getAllPosts(selectedTag || undefined),
    staleTime: 1000 * 30, // 30 seconds stale cache
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: (id: string) => forumService.toggleUpvote(id),
    onMutate: async (postId) => {
      // Optimistic updates
      await queryClient.cancelQueries({ queryKey: ['forum-posts', selectedTag] });
      const previousPosts = queryClient.getQueryData<any[]>(['forum-posts', selectedTag]);

      if (previousPosts) {
        queryClient.setQueryData(
          ['forum-posts', selectedTag],
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
        queryClient.setQueryData(['forum-posts', selectedTag], context.previousPosts);
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

  // Filter and sort posts based on search query, tags, and sortBy criteria
  const filteredAndSortedPosts = React.useMemo(() => {
    if (!posts) return [];

    // 1. Filter posts
    let result = posts.filter((post) => {
      const query = debouncedSearch.toLowerCase().trim();
      if (!query) return true;

      // Handle advanced filtering prefixes
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

      // Default broad search
      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags?.some((t) => t.toLowerCase().includes(query))
      );
    });

    // 2. Sort posts (pinned posts stay on top)
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
      // default: latest (createdAt desc)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [posts, debouncedSearch, sortBy]);

  // Get common tags dynamically from the loaded posts
  const allTags = React.useMemo(() => {
    if (!posts) return [];
    const tagsSet = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet).slice(0, 10); // Display top 10 unique tags
  }, [posts]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Discussions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Exchange interview insights, seek review guidelines, and discuss engineering resources.
          </p>
        </div>

        <Link
          href="/forum/new"
          className={buttonVariants({
            className: 'bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all font-medium flex items-center gap-2 self-start shrink-0 rounded-xl px-4 py-2 h-10',
          })}
        >
          <Plus className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      {/* Main Grid View */}
      <div className="grid gap-8 lg:grid-cols-4 items-start">
        {/* Left Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
            <h3 className="text-[10px] font-semibold font-mono uppercase tracking-wider text-muted-foreground/80 px-2">
              Filter by Topic
            </h3>

            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTag('')}
                className={cn(
                  'w-full justify-start text-xs font-mono h-9 rounded-lg border transition-all duration-200',
                  !selectedTag
                    ? 'bg-secondary text-foreground border-border shadow-xs font-semibold'
                    : 'text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground'
                )}
              >
                <Hash className={cn('h-3.5 w-3.5 mr-2 transition-colors', !selectedTag ? 'text-brand-accent' : 'text-muted-foreground')} />
                ALL DISCUSSIONS
              </Button>

              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    'w-full justify-start text-xs font-mono h-9 rounded-lg border transition-all duration-200',
                    selectedTag === tag
                      ? 'bg-secondary text-foreground border-border shadow-xs font-semibold'
                      : 'text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground'
                  )}
                >
                  <Tag className={cn('h-3.5 w-3.5 mr-2 transition-colors', selectedTag === tag ? 'text-brand-accent' : 'text-muted-foreground')} />
                  #{tag.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Feeds Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search & Sort Panel */}
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder="Search posts (try is:pinned, author:username, tag:name)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent/50 text-sm h-11 rounded-xl shadow-xs w-full"
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

            {/* Filter shortcuts helper bar */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 px-1">
              <span>Filter shortcuts:</span>
              <button
                type="button"
                onClick={() => setSearchQuery('is:pinned')}
                className="hover:text-foreground hover:border-foreground/15 border border-border/40 bg-muted/10 hover:bg-muted/25 px-2 py-0.5 rounded transition-all duration-150"
              >
                is:pinned
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('author:')}
                className="hover:text-foreground hover:border-foreground/15 border border-border/40 bg-muted/10 hover:bg-muted/25 px-2 py-0.5 rounded transition-all duration-150"
              >
                author:username
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('tag:')}
                className="hover:text-foreground hover:border-foreground/15 border border-border/40 bg-muted/10 hover:bg-muted/25 px-2 py-0.5 rounded transition-all duration-150"
              >
                tag:name
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
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
            <div className="text-center p-16 rounded-xl border border-dashed border-border bg-card/20 shadow-xs">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">No Discussions Found</h3>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? "We couldn't find any threads matching your search criteria. Try a different tag or query."
                  : 'Be the first to start a conversation! Submit a forum post above.'}
              </p>
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

                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(post.createdAt)}</span>
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
        </div>
      </div>
    </div>
  );
}
