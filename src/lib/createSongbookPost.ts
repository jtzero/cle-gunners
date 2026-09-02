import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { postSchema } from "@/content.types";

export const getImageDimensions = (imagePath: string): string => {
  const output = execSync(`identify -format "%wx%h" "${imagePath}"`, {
    encoding: "utf-8",
  }).trim();
  if (!output) {
    throw new Error(
      `Could not determine dimensions for image "${imagePath}". Is ImageMagick installed?`,
    );
  }
  return output;
};

export interface SongbookPostInput {
  filename: string;
  title?: string;
  image: string;
  imageAlt?: string;
  imageDimensions?: string;
  imagePlacement: string;
  content: string;
}

export interface CreatedSongbookPost {
  id: string;
  filePath: string;
  content: string;
}

export function parseImagePlacement(
  rawPlacement: string,
): string | Record<string, string> {
  const trimmed = rawPlacement.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, string>;
      }
    } catch {
      // Fallback to string if JSON parsing fails
    }
  }
  return trimmed;
}

export function formatFrontmatterValue(value: unknown): string {
  if (typeof value === "string") {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return String(value);
}

export type ImageOrientation = "portrait" | "landscape" | "square";

export const getImageOrientation = (dimensions: string): ImageOrientation => {
  const [widthString, heightString] = dimensions.split("x");
  const width = parseInt(widthString, 10);
  const height = parseInt(heightString, 10);
  if (width === height) {
    return "square";
  }
  return width > height ? "landscape" : "portrait";
};

export function generateSongbookPostMarkdown(input: SongbookPostInput): string {
  const imagePlacementParsed = parseImagePlacement(input.imagePlacement);
  const imageDimensions =
    input.imageDimensions ?? getImageDimensions(input.image);

  const validationObj: Record<string, unknown> = {
    type: "image",
    image: input.image,
    imageDimensions,
    imagePlacement: imagePlacementParsed,
    orientation: getImageOrientation(imageDimensions),
  };

  if (input.title && input.title.trim() !== "") {
    validationObj.title = input.title.trim();
  }
  if (input.imageAlt && input.imageAlt.trim() !== "") {
    validationObj.imageAlt = input.imageAlt.trim();
  }

  const parseResult = postSchema.safeParse(validationObj);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Validation failed for imagePost schema: ${errorMessages}`);
  }

  const lines: string[] = ["---"];

  if (validationObj.title) {
    lines.push(`title: ${formatFrontmatterValue(validationObj.title)}`);
  }
  lines.push(`image: ${formatFrontmatterValue(input.image)}`);
  if (validationObj.imageAlt) {
    lines.push(`imageAlt: ${formatFrontmatterValue(validationObj.imageAlt)}`);
  }
  lines.push(`imageDimensions: ${formatFrontmatterValue(imageDimensions)}`);

  if (
    typeof imagePlacementParsed === "object" &&
    imagePlacementParsed !== null
  ) {
    lines.push("imagePlacement:");
    for (const [key, val] of Object.entries(imagePlacementParsed)) {
      lines.push(
        `  ${formatFrontmatterValue(key)}: ${formatFrontmatterValue(val)}`,
      );
    }
  } else {
    lines.push(
      `imagePlacement: ${formatFrontmatterValue(imagePlacementParsed)}`,
    );
  }

  if (validationObj.orientation) {
    lines.push(
      `orientation: ${formatFrontmatterValue(validationObj.orientation)}`,
    );
  }

  lines.push("---");

  const bodyContent = input.content.trim();
  if (bodyContent.length > 0) {
    lines.push("");
    lines.push(bodyContent);
  }
  lines.push("");

  return lines.join("\n");
}

export const sanitizeSongbookPostFilename = (filename: string): string => {
  let cleanFilename = filename.trim();
  if (cleanFilename.endsWith(".md")) {
    cleanFilename = cleanFilename.slice(0, -3);
  }
  if (cleanFilename.endsWith(".mdx")) {
    cleanFilename = cleanFilename.slice(0, -4);
  }

  if (
    cleanFilename.length === 0 ||
    cleanFilename === "." ||
    cleanFilename === ".." ||
    /[\\/]/.test(cleanFilename)
  ) {
    throw new Error(
      `Invalid filename "${filename}": path separators and traversal segments are not allowed.`,
    );
  }
  return cleanFilename;
};

export function createSongbookPostFile(
  input: SongbookPostInput,
  baseDir: string = process.cwd(),
): CreatedSongbookPost {
  const cleanFilename = sanitizeSongbookPostFilename(input.filename);

  const markdown = generateSongbookPostMarkdown(input);
  const targetDir = path.join(baseDir, "src", "content", "posts");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, `${cleanFilename}.md`);
  fs.writeFileSync(filePath, markdown, "utf-8");

  return {
    id: cleanFilename,
    filePath,
    content: markdown,
  };
}
