import { glob } from "astro/loaders";
import { defineCollection, reference, z } from "astro:content";
import { matchSchema, seasonSchema, postSchema } from "./content.types";

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
      permission: z.string().optional(),
      competitions: z.coerce.number().optional(),
      limit: z.number().optional(),
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

const competitionsCollection = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "src/content/competitions" }),
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

export const collections = {
  posts: postsCollection,
  pinnedPosts: pinnedPostsCollection,
  pages: pagesCollection,
  fixtures: fixturesCollection,
  manualFixtures: manualFixturesCollection,
  competitions: competitionsCollection,
};
