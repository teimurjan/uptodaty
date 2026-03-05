import type { RawArticle, Source } from "./types";

interface RedditPost {
  data: {
    title: string;
    url: string;
    selftext: string;
    score: number;
    num_comments: number;
    author: string;
    created_utc: number;
    permalink: string;
    is_self: boolean;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
  };
}

async function fetchSubreddit(
  name: string,
  limit: number,
): Promise<RawArticle[]> {
  const response = await fetch(
    `https://www.reddit.com/r/${name}/hot.json?limit=${limit}`,
    {
      headers: { "User-Agent": "uptodaty/1.0" },
    },
  );

  if (!response.ok) {
    throw new Error(`Reddit r/${name}: ${response.status}`);
  }

  const listing: RedditListing = await response.json();

  return listing.data.children.map((post) => ({
    title: post.data.title,
    url: post.data.is_self ? null : post.data.url,
    score: post.data.score,
    commentCount: post.data.num_comments,
    author: post.data.author,
    publishedAt: new Date(post.data.created_utc * 1000),
    body: post.data.selftext || null,
    sourceName: `Reddit r/${name}`,
    sourceUrl: `https://www.reddit.com${post.data.permalink}`,
  }));
}

export function createRedditSource(subreddits: string[]): Source {
  return {
    name: "Reddit",
    async fetch(limit) {
      const perSubreddit = Math.ceil(limit / subreddits.length);
      const articles: RawArticle[] = [];
      const errors: string[] = [];

      for (const subreddit of subreddits) {
        try {
          const posts = await fetchSubreddit(subreddit, perSubreddit);
          articles.push(...posts);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : `r/${subreddit} failed`;
          errors.push(message);
        }
      }

      return {
        sourceName: "Reddit",
        articles,
        fetchedAt: new Date(),
        error: errors.length > 0 ? errors.join("; ") : null,
      };
    },
  };
}
