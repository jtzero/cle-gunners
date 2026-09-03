import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { describe, expect, test } from "vitest";
// TODO appRoot ?
import {
  runCreateSongbookPost,
  type CreateSongbookPostCliDeps,
} from "../../bin/create-songbook-post";

const MAIN_LIST_PAGE = [
  "---",
  'title: "Songbook"',
  "posts: []",
  "---",
  "",
  "# Songbook",
  "",
].join("\n");

const makeTempRepo = (): string =>
  fs.mkdtempSync(path.join(os.tmpdir(), "songbook-cli-test-"));

const createTestImage = (tmpDir: string, imagePath: string): void => {
  const fullPath = path.join(tmpDir, "public", imagePath.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  execSync(`convert -size 100x50 xc:red "${fullPath}"`);
};

const writeSongbookPage = (tmpDir: string, content: string): void => {
  const pagesDir = path.join(tmpDir, "src", "content", "pages");
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.writeFileSync(path.join(pagesDir, "songbook.md"), content, "utf-8");
};

const readSongbookPage = (tmpDir: string): string =>
  fs.readFileSync(
    path.join(tmpDir, "src", "content", "pages", "songbook.md"),
    "utf-8",
  );

const runCli = (
  tmpDir: string,
  overrides: Partial<CreateSongbookPostCliDeps> = {},
): { exitCode: number; output: string } => {
  const messages: string[] = [];
  const recordMessage = (...parts: unknown[]): void => {
    messages.push(parts.map(String).join(" "));
  };
  const exitCode = runCreateSongbookPost({
    env: {},
    argv: [],
    baseDir: tmpDir,
    log: recordMessage,
    errorLog: recordMessage,
    ...overrides,
  });
  return { exitCode, output: messages.join("\n") };
};

const cleanupTempRepo = (tmpDir: string): void => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
};

describe("create-songbook-post cli", () => {
  test("exits 1 with a readable error for each missing required input", () => {
    const cases: { label: string; env: Record<string, string> }[] = [
      {
        label: "filename",
        env: {
          INPUT_IMAGE: "/images/rice.jpg",
        },
      },
      {
        label: "image",
        env: {
          INPUT_FILENAME: "rice-chant",
        },
      },
      {
        label: "content",
        env: {
          INPUT_FILENAME: "rice-chant",
          INPUT_IMAGE: "/images/rice.jpg",
        },
      },
    ];

    for (const testCase of cases) {
      const tmpDir = makeTempRepo();
      try {
        const result = runCli(tmpDir, { env: testCase.env });
        expect(result.exitCode, testCase.label).toBe(1);
        expect(result.output).toContain(
          `'${testCase.label}' input is required.`,
        );
        expect(fs.existsSync(path.join(tmpDir, "src"))).toBe(false);
      } finally {
        cleanupTempRepo(tmpDir);
      }
    }
  });

  test("creates the post file and appends the post to the main songbook list", () => {
    const tmpDir = makeTempRepo();
    try {
      writeSongbookPage(tmpDir, MAIN_LIST_PAGE);
      createTestImage(tmpDir, "/images/saka.jpg");

      const result = runCli(tmpDir, {
        env: {
          INPUT_FILENAME: "saka-chant",
          INPUT_TITLE: "Bukayo Saka",
          INPUT_IMAGE: "/images/saka.jpg",
          INPUT_CONTENT: "We've got Bukayo Saka!",
        },
      });

      expect(result.exitCode).toBe(0);

      const postPath = path.join(
        tmpDir,
        "src",
        "content",
        "posts",
        "saka-chant.md",
      );
      expect(fs.existsSync(postPath)).toBe(true);
      const postContent = fs.readFileSync(postPath, "utf-8");
      expect(postContent).toContain('title: "Bukayo Saka"');
      expect(postContent).toContain('image: "/images/saka.jpg"');
      expect(postContent).toContain('imageDimensions: "100x50"');
      expect(postContent).toContain('imagePlacement: "header"');
      expect(postContent).toContain("We've got Bukayo Saka!");

      expect(readSongbookPage(tmpDir)).toContain('posts: ["saka-chant"]');
      expect(result.output).toContain("Successfully created songbook post");
      expect(result.output).toContain("main posts list");
    } finally {
      cleanupTempRepo(tmpDir);
    }
  });

  test("files the post under the requested songbook section", () => {
    const tmpDir = makeTempRepo();
    try {
      writeSongbookPage(
        tmpDir,
        [
          "---",
          'title: "Songbook"',
          "sections:",
          '  - title: "Past Players"',
          "    posts: []",
          '  - title: "Current Squad"',
          '    posts: ["odegaard"]',
          "---",
        ].join("\n"),
      );
      createTestImage(tmpDir, "/images/wilshere.jpg");

      const result = runCli(tmpDir, {
        env: {
          INPUT_FILENAME: "wilshere-chant",
          INPUT_TITLE: "Jack Wilshere",
          INPUT_IMAGE: "/images/wilshere.jpg",
          INPUT_CONTENT: "Wilshere on the ball",
          INPUT_SONGBOOK_SECTION: "Past Players",
        },
      });

      expect(result.exitCode).toBe(0);
      const pageContent = readSongbookPage(tmpDir);
      const pastPlayersIndex = pageContent.indexOf('"Past Players"');
      const currentSquadIndex = pageContent.indexOf('"Current Squad"');
      const wilshereIndex = pageContent.indexOf("wilshere-chant");
      expect(wilshereIndex).toBeGreaterThan(pastPlayersIndex);
      expect(wilshereIndex).toBeLessThan(currentSquadIndex);
      expect(pageContent).toContain('"odegaard"');
      expect(result.output).toContain('section "Past Players"');
    } finally {
      cleanupTempRepo(tmpDir);
    }
  });

  test("falls back to positional arguments when inputs are absent from the environment", () => {
    const tmpDir = makeTempRepo();
    try {
      writeSongbookPage(tmpDir, MAIN_LIST_PAGE);
      createTestImage(tmpDir, "/images/martin.jpg");

      const result = runCli(tmpDir, {
        env: {
          INPUT_TITLE: "Gabriel Martinelli",
          INPUT_CONTENT: "Martinelli!",
        },
        argv: [
          "node",
          "bin/create-songbook-post.ts",
          "martin-chant",
          "/images/martin.jpg",
          "body",
        ],
      });

      expect(result.exitCode).toBe(0);
      const postPath = path.join(
        tmpDir,
        "src",
        "content",
        "posts",
        "martin-chant.md",
      );
      expect(fs.existsSync(postPath)).toBe(true);
      expect(fs.readFileSync(postPath, "utf-8")).toContain(
        'imagePlacement: "body"',
      );
      expect(readSongbookPage(tmpDir)).toContain('posts: ["martin-chant"]');
    } finally {
      cleanupTempRepo(tmpDir);
    }
  });

  test("environment inputs take precedence over positional arguments", () => {
    const tmpDir = makeTempRepo();
    try {
      writeSongbookPage(tmpDir, MAIN_LIST_PAGE);
      createTestImage(tmpDir, "/images/env.jpg");

      const result = runCli(tmpDir, {
        env: {
          INPUT_FILENAME: "env-post",
          INPUT_TITLE: "Env Post",
          INPUT_IMAGE: "/images/env.jpg",
          INPUT_CONTENT: "Env content",
        },
        argv: [
          "node",
          "bin/create-songbook-post.ts",
          "argv-post",
          "/images/argv.jpg",
        ],
      });

      expect(result.exitCode).toBe(0);
      expect(
        fs.existsSync(
          path.join(tmpDir, "src", "content", "posts", "env-post.md"),
        ),
      ).toBe(true);
      expect(
        fs.existsSync(
          path.join(tmpDir, "src", "content", "posts", "argv-post.md"),
        ),
      ).toBe(false);
    } finally {
      cleanupTempRepo(tmpDir);
    }
  });

  test("exits 1 when the songbook page cannot be found", () => {
    const tmpDir = makeTempRepo();
    try {
      createTestImage(tmpDir, "/images/orphan.jpg");

      const result = runCli(tmpDir, {
        env: {
          INPUT_FILENAME: "orphan-post",
          INPUT_TITLE: "Orphan Post",
          INPUT_IMAGE: "/images/orphan.jpg",
          INPUT_CONTENT: "Orphan content",
        },
      });

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain("Songbook page not found");
      expect(
        fs.existsSync(
          path.join(tmpDir, "src", "content", "posts", "orphan-post.md"),
        ),
      ).toBe(true);
    } finally {
      cleanupTempRepo(tmpDir);
    }
  });
});
