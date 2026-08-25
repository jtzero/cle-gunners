import fs from "fs";
import path from "path";
import os from "os";
import { describe, expect, test } from "vitest";
import { addPostToSongbookPage, updateSongbookPageFile } from "./songbookPage";

const songbookPageFixture = [
  "---",
  'title: "Songbook"',
  "date: 2025-11-12T05:00:00Z",
  "posts:",
  "  [",
  '    "kai-havertz",',
  '    "shite-heart-lane",',
  "  ]",
  "sections:",
  '  - title: "Past Players"',
  '    posts: ["arsene-wenger", "leo-trossard"]',
  "---",
  "",
].join("\n");

describe("songbookPage", () => {
  describe("addPostToSongbookPage", () => {
    test("appends the post to the top-level posts list", () => {
      const updated = addPostToSongbookPage(songbookPageFixture, "declan-rice");

      expect(updated).toContain('    "kai-havertz",');
      expect(updated).toContain('    "shite-heart-lane",');
      expect(updated).toContain('    "declan-rice",');
      const declanIndex = updated.indexOf('"declan-rice"');
      const closingIndex = updated.indexOf("]");
      expect(declanIndex).toBeGreaterThan(-1);
      expect(declanIndex).toBeLessThan(closingIndex);
      expect(updated).toContain('- title: "Past Players"');
    });

    test("preserves surrounding frontmatter when appending to the main list", () => {
      const updated = addPostToSongbookPage(songbookPageFixture, "new-song");

      expect(updated).toContain('title: "Songbook"');
      expect(updated).toContain("date: 2025-11-12T05:00:00Z");
      expect(updated.endsWith("---\n")).toBe(true);
    });

    test("appends the post to a named section's inline posts list", () => {
      const updated = addPostToSongbookPage(
        songbookPageFixture,
        "thierry-henry",
        "Past Players",
      );

      expect(updated).toContain(
        'posts: ["arsene-wenger", "leo-trossard", "thierry-henry"]',
      );
    });

    test("does not modify the main list when a section is targeted", () => {
      const updated = addPostToSongbookPage(
        songbookPageFixture,
        "thierry-henry",
        "Past Players",
      );

      const mainListBlock = updated.slice(
        updated.indexOf("posts:"),
        updated.indexOf("]"),
      );
      expect(mainListBlock).not.toContain("thierry-henry");
    });

    test("returns unchanged content when the post already exists in the list", () => {
      const updated = addPostToSongbookPage(songbookPageFixture, "kai-havertz");
      const sectionUpdated = addPostToSongbookPage(
        songbookPageFixture,
        "leo-trossard",
        "Past Players",
      );

      expect(updated).toBe(songbookPageFixture);
      expect(sectionUpdated).toBe(songbookPageFixture);
    });

    test("supports a single-line top-level posts list", () => {
      const singleLinePage = [
        "---",
        'title: "Songbook"',
        'posts: ["one-chant"]',
        "---",
        "",
      ].join("\n");

      const updated = addPostToSongbookPage(singleLinePage, "two-chant");

      expect(updated).toContain('posts: ["one-chant", "two-chant"]');
    });

    test("fills an empty inline posts list", () => {
      const emptyListPage = [
        "---",
        'title: "Songbook"',
        "posts: []",
        "---",
        "",
      ].join("\n");

      const updated = addPostToSongbookPage(emptyListPage, "first-chant");

      expect(updated).toContain('posts: ["first-chant"]');
    });

    test("throws an error listing available sections when the section is unknown", () => {
      expect(() =>
        addPostToSongbookPage(songbookPageFixture, "new-song", "Current Squad"),
      ).toThrowError(
        /section "Current Squad" not found\. Available sections: "Past Players"\./,
      );
    });

    test("throws an error when a named section has no posts list", () => {
      const sectionWithoutPosts = [
        "---",
        'title: "Songbook"',
        "posts:",
        "  [",
        '    "kai-havertz",',
        "  ]",
        "sections:",
        '  - title: "Legends"',
        "---",
        "",
      ].join("\n");

      expect(() =>
        addPostToSongbookPage(
          sectionWithoutPosts,
          "dennis-bergkamp",
          "Legends",
        ),
      ).toThrowError(/section "Legends" has no posts list/);
    });

    test("rejects post ids containing quotes or newlines", () => {
      expect(() =>
        addPostToSongbookPage(songbookPageFixture, 'ev"il'),
      ).toThrowError(/Invalid post id/);
      expect(() =>
        addPostToSongbookPage(songbookPageFixture, "ev\nil"),
      ).toThrowError(/Invalid post id/);
    });
  });

  describe("updateSongbookPageFile", () => {
    test("writes the updated post into the songbook page file", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "songbook-page-"));
      try {
        const pagesDir = path.join(tmpDir, "src", "content", "pages");
        fs.mkdirSync(pagesDir, { recursive: true });
        const pagePath = path.join(pagesDir, "songbook.md");
        fs.writeFileSync(pagePath, songbookPageFixture, "utf-8");

        const result = updateSongbookPageFile(
          { postId: "martinelli", sectionTitle: "Past Players" },
          tmpDir,
        );

        expect(result.filePath).toBe(pagePath);
        const writtenContent = fs.readFileSync(pagePath, "utf-8");
        expect(writtenContent).toContain(
          'posts: ["arsene-wenger", "leo-trossard", "martinelli"]',
        );
        expect(result.content).toBe(writtenContent);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test("throws an error when the songbook page does not exist", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "songbook-page-"));
      try {
        expect(() =>
          updateSongbookPageFile({ postId: "any-post" }, tmpDir),
        ).toThrowError(/Songbook page not found/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
