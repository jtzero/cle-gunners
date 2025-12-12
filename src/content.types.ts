import { z } from "zod";

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

export const matchSchema = z.object({
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
    currentMatchday: z.number().nullable(),
    winner: seasonWinnerSchema.optional().nullable(),
  }),
  id: z.number(),
  utcDate: z.string().datetime(),
  status: z.string(),
  matchday: z.number(),
  stage: z.string(),
  group: z.string().nullable(),
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
  referees: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        type: z.string(),
        nationality: z.string().nullable(),
      }),
    )
    .optional(),
});

export const seasonSchema = z.object({
  id: z.number(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  currentMatchday: z.number().nullable(),
  winner: seasonWinnerSchema.optional().nullable(),
  stages: z.array(z.string()).optional(),
});

export type MatchType = z.infer<typeof matchSchema>;

const simplePostSchema = z.object({});

const imagePostSchema = z.object({
  title: z.string().optional(),
  date: z.date().optional(),
  image: z.string(),
  imageDimensions: z.string(),
  imagePlacement: z.union([
    z.string(),
    z.object({
      all: z.string(),
      sm: z.string().optional(),
      md: z.string().optional(),
      lg: z.string().optional(),
      xl: z.string().optional(),
    }),
  ]),
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

export const postSchema = z.union([
  videoPostSchema,
  imagePostSchema,
  simplePostSchema,
]);

export type PostType = z.infer<typeof postSchema>;
