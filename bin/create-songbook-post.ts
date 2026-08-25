import path from "path";
import { pathToFileURL } from "url";
import {
  createSongbookPostFile,
  type SongbookPostInput,
} from "@/lib/createSongbookPost";
import { updateSongbookPageFile } from "@/lib/songbookPage";

const REQUIRED_INPUT_KEYS = ["filename", "image", "imageDimensions"] as const;

export interface CreateSongbookPostCliDeps {
  env?: NodeJS.ProcessEnv;
  argv?: string[];
  baseDir?: string;
  log?: (...args: unknown[]) => void;
  errorLog?: (...args: unknown[]) => void;
}

const parseSongbookPostInput = (
  env: NodeJS.ProcessEnv,
  args: string[],
): SongbookPostInput => ({
  filename: env.INPUT_FILENAME || args[0] || "",
  title: env.INPUT_TITLE || undefined,
  date: env.INPUT_DATE || undefined,
  image: env.INPUT_IMAGE || args[1] || "",
  imageAlt: env.INPUT_IMAGE_ALT || undefined,
  imageDimensions: env.INPUT_IMAGE_DIMENSIONS || args[2] || "",
  imagePlacement: env.INPUT_IMAGE_PLACEMENT || args[3] || "header",
  imageLink: env.INPUT_IMAGE_LINK || undefined,
  orientation: env.INPUT_ORIENTATION || undefined,
  metaTitle: env.INPUT_META_TITLE || undefined,
  additionalStyling: env.INPUT_ADDITIONAL_STYLING || undefined,
  content: env.INPUT_CONTENT || undefined,
});

const findMissingRequiredInput = (input: SongbookPostInput): string | null =>
  REQUIRED_INPUT_KEYS.find((key) => !input[key]) ?? null;

export const runCreateSongbookPost = (
  deps: CreateSongbookPostCliDeps = {},
): number => {
  const env = deps.env ?? process.env;
  const args = (deps.argv ?? process.argv).slice(2);
  const baseDir = deps.baseDir ?? process.cwd();
  const log = deps.log ?? console.log;
  const errorLog = deps.errorLog ?? console.error;

  const input = parseSongbookPostInput(env, args);
  const missingInput = findMissingRequiredInput(input);
  if (missingInput) {
    errorLog(`Error: '${missingInput}' input is required.`);
    return 1;
  }

  try {
    const result = createSongbookPostFile(input, baseDir);
    log(`Successfully created songbook post at: ${result.filePath}`);

    const songbookSection = env.INPUT_SONGBOOK_SECTION?.trim();
    const pageResult = updateSongbookPageFile(
      {
        postId: result.id,
        sectionTitle: songbookSection || undefined,
      },
      baseDir,
    );
    const placementMessage = songbookSection
      ? `section "${songbookSection}"`
      : "main posts list";
    log(
      `Added "${result.id}" to the ${placementMessage} in: ${pageResult.filePath}`,
    );
    return 0;
  } catch (error) {
    errorLog("Error creating songbook post:", error);
    return 1;
  }
};

const isDirectExecution = (): boolean =>
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isDirectExecution()) {
  const exitCode = runCreateSongbookPost();
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
