import { type ImagePostType } from "@/content.types";

interface SingleImagePost {
  data: ImagePostType;
}

export const hasDynamicMedia = (post: SingleImagePost): boolean => {
  return (
    typeof post.data.imagePlacement !== "string" && post.data.imagePlacement
  );
};
