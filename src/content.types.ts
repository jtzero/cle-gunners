import { z } from "zod";

import * as MediaPost from "@/lib/mediaPost";

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

const simplePostSchema = z
  .object({
    type: z.literal("simple").optional(),
  })
  .strict()
  .transform((val) => ({
    ...val,
    type: "simple",
  }));
export type SimplePostType = z.infer<typeof simplePostSchema>;

const imageSetting = z.object({
  src: z.string(),
  dimensions: z.string(),
  media: z.string().optional(),
  alt: z.string().optional(),
  imageAlt: z.string().optional(),
  imageDimensions: z.string().optional(),
  imagePlacement: z
    .union([
      z.string(),
      z.object({
        all: z.string(),
        sm: z.string().optional(),
        md: z.string().optional(),
        lg: z.string().optional(),
        xl: z.string().optional(),
      }),
    ])
    .optional(),
  parsedImageWidth: z.number().optional(),
  parsedImageHeight: z.number().optional(),
  imageLink: z.string().optional(),
});
export type ImageSetting = z.infer<typeof imageSetting>;

const imagePostSchema = z
  .object({
    title: z.string().optional(),
    date: z.date().optional(),
    type: z.literal("image").optional(),
    image: z.string(),
    imageAlt: z.string().optional(),
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
    orientation: z.string().optional(),
    metaTitle: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => !!data.title || !!data.imageAlt,
    "If there is no title, there must be an image alt",
  )
  .transform((val) => {
    const [width, height] = MediaPost.parseDimensions(val.imageDimensions);
    return {
      ...val,
      type: "image",
      parsedImageWidth: width,
      parsedImageHeight: height,
    };
  });
export type ImagePostType = z.infer<typeof imagePostSchema>;

const multiImagePostSchema = z
  .object({
    title: z.string().optional(),
    date: z.date().optional(),
    type: z.literal("multiImage").optional(),
    // I think this should be in "images" in the future
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
    // I think this should be in "images" in the future
    imageLink: z.string().optional(),
    images: z.array(imageSetting),
    metaTitle: z.string().optional(),
  })
  .strict()
  .transform((val) => ({
    ...val,
    type: "multiImage",
  }));
export type MultiImagePostType = z.infer<typeof multiImagePostSchema>;

const videoPostSchema = z
  .object({
    title: z.string(),
    date: z.date().optional(),
    type: z.literal("video").optional(),
    video: z.string(),
    videoDimensions: z.string(),
    parsedVideoWidth: z.number().optional(),
    parsedVideoHeight: z.number().optional(),
    videoPlacement: z.string().optional(),
    orientation: z.string().optional(),
    metaTitle: z.string().optional(),
  })
  .strict()
  .transform((val) => {
    const [width, height] = MediaPost.parseDimensions(val.videoDimensions);
    return {
      ...val,
      type: "video",
      parsedVideoWidth: width,
      parsedVideoHeight: height,
    };
  });
export type VideoPostType = z.infer<typeof videoPostSchema>;

export const postSchema = z.union([
  videoPostSchema,
  imagePostSchema,
  multiImagePostSchema,
  simplePostSchema,
]);

export type PostType = z.infer<typeof postSchema>;
