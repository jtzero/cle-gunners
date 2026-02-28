import { expect, test, describe } from "vitest";
import { postSchema } from "./content.types";

describe("postSchema", () => {
  test("parses a video post", () => {
    const result = postSchema.safeParse({
      title: "match highlights",
      video: "highlight.mp4",
      videoDimensions: "1920x1080",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("video");
    }
  });

  test("parses an image post", () => {
    const result = postSchema.safeParse({
      image: "photo.jpg",
      imageAlt: "a photo",
      imageDimensions: "800x600",
      imagePlacement: "above",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("image");
    }
  });

  test("parses a multi-image post", () => {
    const result = postSchema.safeParse({
      images: [{ src: "photo1.jpg", dimensions: "800x600" }],
      imagePlacement: "above",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("multiImage");
    }
  });

  test("parses a simple post", () => {
    const result = postSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("simple");
    }
  });

  test("rejects input with no matching schema", () => {
    const result = postSchema.safeParse({
      title: "orphaned title",
    });
    expect(result.success).toBe(false);
  });

  test("rejects input that would match multiple schemas (zxor behavior)", () => {
    const result = postSchema.safeParse({
      title: "match highlights",
      video: "highlight.mp4",
      videoDimensions: "1920x1080",
      image: "photo.jpg",
      imageDimensions: "800x600",
    });
    expect(result.success).toBe(false);
  });
});
