import fs from "fs";
import path from "path";
import os from "os";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  generateSongbookPostMarkdown,
  createSongbookPostFile,
  parseImagePlacement,
  getImageDimensions,
  getImageOrientation,
} from "./createSongbookPost";
import { postSchema } from "@/content.types";

const mockExecSync = vi.fn();
vi.mock("child_process", () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

beforeEach(() => {
  mockExecSync.mockReturnValue("200x100");
});

afterEach(() => {
  mockExecSync.mockReset();
});

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

  describe("getImageDimensions", () => {
    test("returns width x height from identify", () => {
      expect(getImageDimensions("/images/test.jpg")).toBe("200x100");
      expect(mockExecSync).toHaveBeenCalledWith(
        'identify -format "%wx%h" "/images/test.jpg"',
        { encoding: "utf-8" },
      );
    });

    test("throws when identify returns empty output", () => {
      mockExecSync.mockReturnValue("");
      expect(() => getImageDimensions("/images/missing.jpg")).toThrow(
        /Could not determine dimensions/,
      );
    });
  });

  describe("getImageOrientation", () => {
    test("derives square orientation from matching dimensions", () => {
      expect(getImageOrientation("300x300")).toBe("square");
    });

    test("derives landscape orientation when width exceeds height", () => {
      expect(getImageOrientation("300x200")).toBe("landscape");
    });

    test("derives portrait orientation when height exceeds width", () => {
      expect(getImageOrientation("200x300")).toBe("portrait");
    });
  });

  describe("generateSongbookPostMarkdown", () => {
    test("generates markdown compliant with imagePost schema", () => {
      const markdown = generateSongbookPostMarkdown({
        filename: "saka-chant",
        title: "Bukayo Saka",
        image: "/images/saka.jpg",
        imagePlacement: "header",
        content: "We've got Bukayo Saka...",
      });

      expect(markdown).toContain('title: "Bukayo Saka"');
      expect(markdown).toContain('image: "/images/saka.jpg"');
      expect(markdown).toContain('imageDimensions: "200x100"');
      expect(markdown).toContain('orientation: "landscape"');
      expect(markdown).toContain('imagePlacement: "header"');
      expect(markdown).toContain("We've got Bukayo Saka...");
    });

    test("uses provided imageDimensions over auto-detection", () => {
      const markdown = generateSongbookPostMarkdown({
        filename: "saka-chant",
        title: "Bukayo Saka",
        image: "/images/saka.jpg",
        imageDimensions: "735x990",
        imagePlacement: "header",
        content: "We've got Bukayo Saka...",
      });

      expect(markdown).toContain('imageDimensions: "735x990"');
      expect(mockExecSync).not.toHaveBeenCalled();
    });

    test("supports imagePlacement as responsive JSON object", () => {
      const markdown = generateSongbookPostMarkdown({
        filename: "rice-chant",
        title: "Declan Rice",
        image: "/images/rice.jpg",
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
          imagePlacement: "header",
          content: "Missing both title and imageAlt",
        });
      }).toThrowError(/Validation failed for imagePost schema/);
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
          imagePlacement: "body",
          content: "Evil content",
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
