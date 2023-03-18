import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/posts" }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().optional(),
    description: z.string().optional(),
    date: z.date(),
    image: z.string().optional(),
    imageDimensions: z.string().optional(),
  }),
});

const pinnedPostsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/pinned-posts" }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().optional(),
    description: z.string().optional(),
    date: z.date(),
    image: z.string().optional(),
    imageDimensions: z.string().optional(),
  }),
});

const pagesCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/pages" }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    metaTitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    imageDimensions: z.string().optional(),
    layout: z.string().optional(),
  }),
});

export const collections = {
  posts: postsCollection,
  pinnedPosts: pinnedPostsCollection,
  pages: pagesCollection,
};
