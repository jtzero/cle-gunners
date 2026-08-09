import fs from "fs";
import path from "path";
import { postSchema } from "@/content.types";

export interface SongbookPostInput {
  filename: string;
  title?: string;
  date?: string;
  image: string;
  imageAlt?: string;
  imageDimensions: string;
  imagePlacement: string;
  imageLink?: string;
  orientation?: string;
  metaTitle?: string;
  additionalStyling?: string;
  content?: string;
}

export interface CreatedSongbookPost {
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

export function generateSongbookPostMarkdown(input: SongbookPostInput): string {
  const imagePlacementParsed = parseImagePlacement(input.imagePlacement);

  const validationObj: Record<string, unknown> = {
    type: "image",
    image: input.image,
    imageDimensions: input.imageDimensions,
    imagePlacement: imagePlacementParsed,
  };

  if (input.title && input.title.trim() !== "") {
    validationObj.title = input.title.trim();
  }
  if (input.date && input.date.trim() !== "") {
    const trimmedDate = input.date.trim();
    const parsedDate = new Date(trimmedDate);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) ||
      isNaN(parsedDate.getTime())
    ) {
      throw new Error(
        `Invalid date "${trimmedDate}" for songbook post. Expected format YYYY-MM-DD.`,
      );
    }
    validationObj.date = parsedDate;
  }
  if (input.imageAlt && input.imageAlt.trim() !== "") {
    validationObj.imageAlt = input.imageAlt.trim();
  }
  if (input.imageLink && input.imageLink.trim() !== "") {
    validationObj.imageLink = input.imageLink.trim();
  }
  if (input.orientation && input.orientation.trim() !== "") {
    validationObj.orientation = input.orientation.trim();
  }
  if (input.metaTitle && input.metaTitle.trim() !== "") {
    validationObj.metaTitle = input.metaTitle.trim();
  }
  if (input.additionalStyling && input.additionalStyling.trim() !== "") {
    validationObj.additionalStyling = input.additionalStyling.trim();
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
  if (validationObj.date instanceof Date) {
    lines.push(`date: ${validationObj.date.toISOString().slice(0, 10)}`);
  }
  lines.push(`image: ${formatFrontmatterValue(input.image)}`);
  if (validationObj.imageAlt) {
    lines.push(`imageAlt: ${formatFrontmatterValue(validationObj.imageAlt)}`);
  }
  lines.push(
    `imageDimensions: ${formatFrontmatterValue(input.imageDimensions)}`,
  );

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

  if (validationObj.imageLink) {
    lines.push(`imageLink: ${formatFrontmatterValue(validationObj.imageLink)}`);
  }
  if (validationObj.orientation) {
    lines.push(
      `orientation: ${formatFrontmatterValue(validationObj.orientation)}`,
    );
  }
  if (validationObj.metaTitle) {
    lines.push(`metaTitle: ${formatFrontmatterValue(validationObj.metaTitle)}`);
  }
  if (validationObj.additionalStyling) {
    lines.push(
      `additionalStyling: ${formatFrontmatterValue(validationObj.additionalStyling)}`,
    );
  }

  lines.push("---");

  const bodyContent = input.content ? input.content.trim() : "";
  if (bodyContent.length > 0) {
    lines.push("");
    lines.push(bodyContent);
  }
  lines.push("");

  return lines.join("\n");
}

export function createSongbookPostFile(
  input: SongbookPostInput,
  baseDir: string = process.cwd(),
): CreatedSongbookPost {
  let cleanFilename = input.filename.trim();
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
      `Invalid filename "${input.filename}": path separators and traversal segments are not allowed.`,
    );
  }

  const markdown = generateSongbookPostMarkdown(input);
  const targetDir = path.join(baseDir, "src", "content", "posts");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, `${cleanFilename}.md`);
  fs.writeFileSync(filePath, markdown, "utf-8");

  return {
    filePath,
    content: markdown,
  };
}
