import { glob } from "astro/loaders";
import { defineCollection, reference, z } from "astro:content";

const postSchema = z.object({
  title: z.string().optional(),
  date: z.date(),
  image: z.string().optional(),
  imageDimensions: z.string().optional(),
  imagePlacement: z.string().optional(),
  parsedImageWidth: z.number().optional(),
  parsedImageHeight: z.number().optional(),
  imageLink: z.string().optional(),
  video: z.string().optional(),
  videoDimensions: z.string().optional(),
  parsedVideoWidth: z.number().optional(),
  parsedVideoHeight: z.number().optional(),
  videoPlacement: z.string().optional(),
  videoOrientation: z.string().optional(),
  metaTitle: z.string().optional(),
});

const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/posts" }),
  schema: postSchema,
});

const pinnedPostsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/pinned-posts" }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().optional(),
    date: z.date(),
    image: z.string().optional(),
    imageDimensions: z.string().optional(),
    posts: z.array(reference("posts")).optional(),
    additionalStyling: z.string().optional(),
    weight: z.number().optional(),
  }),
});

const pagesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/pages" }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    metaTitle: z.string().optional(),
    image: z.string().optional(),
    imageDimensions: z.string().optional(),
    layout: z.string().optional(),
    posts: z.array(z.string()).optional(),
  }),
});

const matchSchema = z.object({
  area: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
    flag: z.string(),
  }),
  competition: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
    type: z.string(),
    emblem: z.string(),
  }),
  season: z.object({
    id: z.number(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    currentMatchday: z.number(),
    winner: z.number().nullable(),
  }),
  id: z.number(),
  utcDate: z.string().datetime(),
  status: z.string(),
  matchday: z.number(),
  stage: z.string(),
  group: z.number().nullable(),
  lastUpdated: z.string().datetime(),
  homeTeam: z.object({
    id: z.number(),
    name: z.string(),
    shortName: z.string(),
    tla: z.string(),
    crest: z.string(),
  }),
  awayTeam: z.object({
    id: z.number(),
    name: z.string(),
    shortName: z.string(),
    tla: z.string(),
    crest: z.string(),
  }),
  score: z.object({
    winner: z.number().nullable(),
    duration: z.string(),
    fullTime: z.object({
      home: z.number().nullable(),
      away: z.number().nullable(),
    }),
    halfTime: z.object({
      home: z.number().nullable(),
      away: z.number().nullable(),
    }),
  }),
  odds: z.object({
    msg: z.string(),
  }),
  referees: z.array(z.object({}).optional()),
});

const fixturesCollection = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "src/content/fixtures" }),
  schema: z.object({
    filters: z.object({
      dateFrom: z.string().date().optional(),
      dateTo: z.string().date().optional(),
      permission: z.string(),
      competitions: z.coerce.number().optional(),
      limit: z.number(),
    }),
    resultSet: z.object({
      count: z.number(),
      competitions: z.string(),
      first: z.string().date(),
      last: z.string().date(),
      played: z.number(),
      wins: z.number(),
      draws: z.number(),
      losses: z.number(),
    }),
    matches: z.array(matchSchema),
  }),
});

export type MatchType = z.infer<typeof matchSchema>;
export type PostType = z.infer<typeof postSchema>;
export const collections = {
  posts: postsCollection,
  pinnedPosts: pinnedPostsCollection,
  pages: pagesCollection,
  fixtures: fixturesCollection,
};
