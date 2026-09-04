export type UserRole = 'ADMIN' | 'SENIOR' | 'MEMBER';

export type YearTarget = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'ALL';

export type CampType = 'WINTER' | 'SUMMER';

export type EventType = 'CAMP' | 'HACKATHON' | 'SESSION' | 'CONTEST';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  year: number;
  bio: string | null;
  phone: string | null;
  isProfileComplete: boolean;
  hackerrankUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  title: string;
  speakerName: string;
  speakerBio: string | null;
  description: string;
  date: string; // ISO date string
  venue: string;
  recordingUrl: string | null;
  slidesUrl: string | null;
  tags: string[];
  yearTarget: YearTarget;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  hackerrankUrl: string;
  accessCode: string | null;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  yearTarget: YearTarget;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean; // Utility field calculated on the frontend/backend
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  contestId: string;
  score: number;
  rank: number | null;
  syncedAt: string;
  user?: User;
  contest?: Contest;
}

export interface Camp {
  id: string;
  title: string;
  description: string;
  type: CampType;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  venue: string | null;
  maxSeats: number | null;
  tags: string[];
  yearTarget: YearTarget;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
}

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  rules: string | null;
  prizes: string | null;
  regDeadline: string; // ISO date string
  submissionDeadline: string; // ISO date string
  maxTeamSize: number;
  minTeamSize: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isRegistered?: boolean; // Calculated helper property from detail endpoints
  teams?: HackathonTeam[];
}

export interface HackathonTeam {
  id: string;
  hackathonId: string;
  teamName: string;
  joinCode: string;
  submissionUrl: string | null;
  repoUrl: string | null;
  score: number | null;
  submittedAt: string | null;
  createdAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  hackathonId: string;
  user?: User;
}

export interface Registration {
  id: string;
  userId: string;
  eventType: EventType;
  registeredAt: string;
  campId: string | null;
  hackathonId: string | null;
  user?: User;
  camp?: Camp;
  hackathon?: Hackathon;
}

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  upvoteCount: number;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  imageUrls: string[];
  author?: User;
  commentsCount?: number; // Injected client-side helper or by specific REST endpoints
  hasUpvoted?: boolean; // Injected helper determining if the current user has upvoted
  comments?: ForumComment[];
  _count?: {
    comments: number;
    upvotes: number;
  };
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  post?: ForumPost;
  author?: User;
  replies?: ForumComment[];
}

export interface Upvote {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  eventType: EventType;
  date: string; // ISO date string
  endDate: string | null; // ISO date string
  yearTarget: YearTarget;
  sessionId: string | null;
  contestId: string | null;
  campId: string | null;
  hackathonId: string | null;
}
