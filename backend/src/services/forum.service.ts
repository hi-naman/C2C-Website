import prisma from '../config/db';

// get all posts (excluding soft-deleted), pinned first
export const getAllPosts = async (tag?: string, currentUserId?: string) => {
  const posts = await prisma.forumPost.findMany({
    where: {
      isDeleted: false,
      ...(tag ? { tags: { has: tag } } : {}),
    },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, role: true, year: true },
      },
      _count: {
        select: { comments: true, upvotes: true },
      },
      upvotes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return posts.map((post) => {
    const hasUpvoted = currentUserId ? ((post.upvotes?.length || 0) > 0) : false;
    const { upvotes, ...rest } = post as any;
    return {
      ...rest,
      hasUpvoted,
    };
  });
};

//get a single post with its comments
export const getPostById = async (id: string, currentUserId?: string) => {
  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, role: true, year: true},
      },
      comments: {
        where: { isDeleted: false },
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { upvotes: true },
      },
      upvotes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
    },
  });

  if (!post) return null;

  const hasUpvoted = currentUserId ? ((post.upvotes?.length || 0) > 0) : false;
  const { upvotes, ...rest } = post as any;
  return {
    ...rest,
    hasUpvoted,
  };
};

export const createPost = async (data: {
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  imageUrls: string[];
}) => {
  return await prisma.forumPost.create({ data });
};

export const updatePost = async (id: string, data: Partial<{
  title: string;
  content: string;
  tags: string[];
  imageUrls: string[];
}>) => {
  return await prisma.forumPost.update({ where: { id }, data });
};

// Soft delete
export const softDeletePost = async (id: string) => {
  return await prisma.forumPost.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const deletePost = async (id: string) => {
  return await prisma.forumPost.delete({ where: { id } });
};

//---------------- Comments-------------------------------------

export const createComment = async (data: {
  postId: string;
  authorId: string;
  content: string;
}) => {
  return await prisma.forumComment.create({ data });
};

export const getCommentById = async (id: string) => {
  return await prisma.forumComment.findUnique({ where: { id } });
};

// Soft delete a comment
export const softDeleteComment = async (id: string) => {
  return await prisma.forumComment.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const updateComment = async (id: string, content: string) => {
  return await prisma.forumComment.update({
    where: { id },
    data: { content },
  });
};

//---------------- Upvotes--------------------------------------------

// Check if user already upvoted a post
export const getUpvote = async (userId: string, postId: string) => {
  return await prisma.upvote.findUnique({
    where: { userId_postId: { userId, postId } },
  });
};

// Toggle upvote — add if not present, remove if present
export const toggleUpvote = async (userId: string, postId: string) => {
  const existing = await getUpvote(userId, postId);

  if (existing) {
    // remove upvote + decrement count in a transaction
    await prisma.$transaction([
      prisma.upvote.delete({ where: { id: existing.id } }),
      prisma.forumPost.update({
        where: { id: postId },
        data: { upvoteCount: { decrement: 1 } },
      }),
    ]);
    return { upvoted: false };
  } else {
    // add upvote + increment count in a transaction
    await prisma.$transaction([
      prisma.upvote.create({ data: { userId, postId } }),
      prisma.forumPost.update({
        where: { id: postId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);
    return { upvoted: true };
  }
};