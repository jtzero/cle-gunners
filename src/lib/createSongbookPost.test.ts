import fs from "fs";
import path from "path";
import os from "os";
import { describe, expect, test } from "vitest";
import {
  generateSongbookPostMarkdown,
  createSongbookPostFile,
  parseImagePlacement,
} from "./createSongbookPost";
import { postSchema } from "@/content.types";

describe("createSongbookPost", () => {
  describe("parseImagePlacement", () => {
    test("parses plain string placement", () => {
      expect(parseImagePlacement("header")).toBe("header");
      expect(parseImagePlacement("body")).toBe("body");
    });

    test("parses valid JSON object placement", () => {
      const result = parseImagePlacement('{"all":"header","md":"body"}');
      expect(result).toEqual({ all: "header", md: "body" });
    });

    test("falls back to raw string when JSON is invalid", () => {
      const result = parseImagePlacement("{invalid json}");
      expect(result).toBe("{invalid json}");
    });
  });

  describe("generateSongbookPostMarkdown", () => {
    test("generates markdown compliant with imagePost schema", () => {
      const markdown = generateSongbookPostMarkdown({
        filename: "saka-chant",
        title: "Bukayo Saka",
        image: "/images/saka.jpg",
        imageDimensions: "735x990",
        imagePlacement: "header",
        orientation: "portrait",
        content: "We've got Bukayo Saka...",
      });

      expect(markdown).toContain('title: "Bukayo Saka"');
      expect(markdown).toContain('image: "/images/saka.jpg"');
      expect(markdown).toContain('imageDimensions: "735x990"');
      expect(markdown).toContain('imagePlacement: "header"');
      expect(markdown).toContain("We've got Bukayo Saka...");
    });

    test("supports imagePlacement as responsive JSON object", () => {
      const markdown = generateSongbookPostMarkdown({
        filename: "rice-chant",
        title: "Declan Rice",
        image: "/images/rice.jpg",
        imageDimensions: "1242x828",
        imagePlacement: '{"all":"header","md":"body"}',
        imageAlt: "Declan Rice celebrating",
        content: "Declan Rice...",
      });

      expect(markdown).toContain("imagePlacement:");
      expect(markdown).toContain('  "all": "header"');
      expect(markdown).toContain('  "md": "body"');
      expect(markdown).toContain('imageAlt: "Declan Rice celebrating"');
    });

    test("throws error if inputs fail imagePost schema validation", () => {
      expect(() => {
        generateSongbookPostMarkdown({
          filename: "invalid-post",
          image: "/images/test.jpg",
          imageDimensions: "100x100",
          imagePlacement: "header",
          // Missing both title and imageAlt
        });
      }).toThrowError(/Validation failed for imagePost schema/);
    });

    test("throws error for an invalid date instead of omitting it", () => {
      expect(() => {
        generateSongbookPostMarkdown({
          filename: "invalid-date-post",
          title: "Invalid Date Post",
          date: "not-a-date",
          image: "/images/test.jpg",
          imageDimensions: "100x100",
          imagePlacement: "header",
        });
      }).toThrowError(/Invalid date "not-a-date"/);
    });
  });

  describe("createSongbookPostFile", () => {
    test("creates songbook post file in target directory", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "songbook-test-"));
      try {
        const result = createSongbookPostFile(
          {
            filename: "saliba-chant",
            title: "William Saliba",
            image: "/images/saliba.jpg",
            imageDimensions: "500x500",
            imagePlacement: "body",
            content: "Te-quila!",
          },
          tmpDir,
        );

        const expectedPath = path.join(
          tmpDir,
          "src",
          "content",
          "posts",
          "saliba-chant.md",
        );
        expect(result.filePath).toBe(expectedPath);
        expect(fs.existsSync(expectedPath)).toBe(true);

        const writtenContent = fs.readFileSync(expectedPath, "utf-8");
        expect(writtenContent).toContain('title: "William Saliba"');
        expect(writtenContent).toContain("Te-quila!");
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
    test("rejects filenames that escape the target directory", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "songbook-test-"));
      try {
        const input = {
          filename: "../../evil",
          title: "Evil",
          image: "/images/evil.jpg",
          imageDimensions: "500x500",
          imagePlacement: "body",
        };
        expect(() => createSongbookPostFile(input, tmpDir)).toThrowError(
          /Invalid filename/,
        );
        expect(
          fs.existsSync(path.join(tmpDir, "src", "content", "posts")),
        ).toBe(false);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
