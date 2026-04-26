import type { Timestamp } from 'firebase-admin/firestore';

// Collection: myContent
// Stores your own tweets and articles used for context when generating replies
export interface MyContent {
  id: string;
  type: 'tweet' | 'article';
  content: string;
  url?: string;
  createdAt: Timestamp;
  embedding?: number[];
}

// Collection: targetAccounts
// Twitter accounts whose tweets are fetched for the feed
export interface TargetAccount {
  id: string;
  handle: string;
  tier: number;   // 1 = highest priority, higher = lower priority
  active: boolean;
  createdAt: Timestamp;
}

// Collection: tweets
// id = Twitter tweet ID
// Cached tweets fetched from target accounts
export interface Tweet {
  id: string;
  authorHandle: string;
  content: string;
  postedAt: Timestamp;
  fetchedAt: Timestamp;
  metrics?: Record<string, unknown>;
  embedding?: number[];
}

// Collection: suggestions
// AI-generated reply suggestions tied to a tweet
export interface Suggestion {
  id: string;
  tweetId: string;
  type: 'plug' | 'draft';
  matchedContentId?: string;  // ref to myContent doc for 'plug' type
  draftText?: string;
  status: 'pending' | 'ticked' | 'copied' | 'used' | 'rejected' | 'edited';
  editedText?: string;
  // 'feed' = generated from the main feed flow
  // 'single' = generated from the /quick single-tweet paste flow
  source: 'feed' | 'single';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
