import { glob } from "astro/loaders";
import { defineCollection, reference, z } from "astro:content";

const simplePostSchema = z.object({});

const imagePostSchema = z.object({
  title: z.string().optional(),
  date: z.date().optional(),
  image: z.string(),
  imageDimensions: z.string(),
  imagePlacement: z.string().optional(),
  parsedImageWidth: z.number().optional(),
  parsedImageHeight: z.number().optional(),
  imageLink: z.string().optional(),
  metaTitle: z.string().optional(),
});

const videoPostSchema = z.object({
  title: z.string(),
  date: z.date().optional(),
  video: z.string(),
  videoDimensions: z.string(),
  parsedVideoWidth: z.number().optional(),
  parsedVideoHeight: z.number().optional(),
  videoPlacement: z.string().optional(),
  videoOrientation: z.string().optional(),
  metaTitle: z.string().optional(),
});

const postSchema = z.union([
  imagePostSchema,
  videoPostSchema,
  simplePostSchema,
]);

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
    posts: z.array(z.string()).default([]),
  }),
});
const seasonWinnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortName: z.string(),
  tla: z.string(),
  crest: z.string().url(),
  address: z.string(),
  website: z.string().url(),
  founded: z.number(),
  clubColors: z.string(),
  venue: z.string(),
  lastUpdated: z.string().datetime(),
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
    winner: seasonWinnerSchema.optional().nullable(),
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
    winner: z.string().nullable(), // HOME_TEAM, AWAY_TEAM ....
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
      competitions: z.string().optional(),
      first: z.string().date().optional(),
      last: z.string().date().optional(),
      played: z.number().optional(),
      wins: z.number().optional(),
      draws: z.number().optional(),
      losses: z.number().optional(),
    }),
    matches: z.array(matchSchema),
  }),
});

const manualFixturesCollection = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "src/content/manual-fixtures" }),
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
      competitions: z.string().optional(),
      first: z.string().date().optional(),
      last: z.string().date().optional(),
      played: z.number().optional(),
      wins: z.number().optional(),
      draws: z.number().optional(),
      losses: z.number().optional(),
    }),
    matches: z.array(matchSchema),
  }),
});

const seasonSchema = z.object({
  id: z.number(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  currentMatchday: z.number(),
  winner: seasonWinnerSchema.optional().nullable(),
  stages: z.array(z.string()),
});

const competitionsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/competitions" }),
  schema: z.object({
    area: z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
      flag: z.string(),
    }),
    id: z.number(),
    name: z.string(),
    code: z.string(),
    type: z.string(),
    emblem: z.string(),
    currentSeason: seasonSchema,
    seasons: z.array(seasonSchema),
  }),
});

export type MatchType = z.infer<typeof matchSchema>;
export type PostType = z.infer<typeof postSchema>;
export const collections = {
  posts: postsCollection,
  pinnedPosts: pinnedPostsCollection,
  pages: pagesCollection,
  fixtures: fixturesCollection,
  manualFixtures: manualFixturesCollection,
  competitions: competitionsCollection,
};
