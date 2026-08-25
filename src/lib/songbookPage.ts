import fs from "fs";
import path from "path";

export interface SongbookPageUpdateInput {
  postId: string;
  sectionTitle?: string;
}

export interface UpdatedSongbookPage {
  filePath: string;
  content: string;
}

interface ListSpan {
  openLineIndex: number;
  closeLineIndex: number;
}

interface SectionSpan {
  title: string;
  titleLineIndex: number;
  endLineIndex: number;
}

const SONGBOOK_PAGE_RELATIVE_PATH = path.join(
  "src",
  "content",
  "pages",
  "songbook.md",
);

const FRONTMATTER_DELIMITER = "---";

const TOP_LEVEL_POSTS_LINE_PATTERN = /^posts:/;
const INDENTED_POSTS_LINE_PATTERN = /^\s+posts:/;
const FLOW_LIST_CLOSE_LINE_PATTERN = /^\s*]/;
const SECTION_TITLE_LINE_PATTERN = /^\s*-\s*title:\s*(.+?)\s*$/;
const LEADING_WHITESPACE_PATTERN = /^\s*/;
const INVALID_POST_ID_PATTERN = /["'\n\r]/;

const parseQuotedValue = (rawValue: string): string =>
  rawValue.trim().replace(/^["']/, "").replace(/["']$/, "");

const splitFlowListEntries = (listText: string): string[] => {
  const openIndex = listText.indexOf("[");
  const closeIndex = listText.lastIndexOf("]");
  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return [];
  }
  return listText
    .slice(openIndex + 1, closeIndex)
    .split(",")
    .map((entry) => parseQuotedValue(entry))
    .filter((entry) => entry.length > 0);
};

const findFlowListSpan = (
  lines: string[],
  fromIndex: number,
  toIndex: number,
  linePattern: RegExp,
): ListSpan | null => {
  let keyLineIndex = -1;
  for (let i = fromIndex; i < toIndex; i++) {
    if (linePattern.test(lines[i])) {
      keyLineIndex = i;
      break;
    }
  }
  if (keyLineIndex === -1) {
    return null;
  }

  let openLineIndex = -1;
  let openBracketIndex = -1;
  for (let i = keyLineIndex; i < toIndex; i++) {
    const bracketIndex = lines[i].indexOf("[");
    if (bracketIndex !== -1) {
      openLineIndex = i;
      openBracketIndex = bracketIndex;
      break;
    }
  }
  if (openLineIndex === -1) {
    throw new Error(
      "Unsupported songbook page format: posts lists must use flow style ([...]).",
    );
  }

  if (lines[openLineIndex].includes("]", openBracketIndex)) {
    return { openLineIndex: openLineIndex, closeLineIndex: openLineIndex };
  }
  for (
    let closeCandidate = openLineIndex + 1;
    closeCandidate < toIndex;
    closeCandidate++
  ) {
    if (FLOW_LIST_CLOSE_LINE_PATTERN.test(lines[closeCandidate])) {
      return { openLineIndex: openLineIndex, closeLineIndex: closeCandidate };
    }
  }
  throw new Error("Unsupported songbook page format: unterminated posts list.");
};

const joinSpannedLines = (lines: string[], span: ListSpan): string =>
  lines.slice(span.openLineIndex, span.closeLineIndex + 1).join("\n");

const appendToInlineListLine = (line: string, postId: string): string => {
  const openIndex = line.indexOf("[");
  const closeIndex = line.lastIndexOf("]");
  const inner = line.slice(openIndex + 1, closeIndex);
  if (inner.trim() === "") {
    return `${line.slice(0, openIndex + 1)}"${postId}"${line.slice(closeIndex)}`;
  }
  return `${line.slice(0, closeIndex).trimEnd()}, "${postId}"${line.slice(closeIndex)}`;
};

const appendEntryBeforeFlowClose = (
  lines: string[],
  span: ListSpan,
  postId: string,
): string[] => {
  const closeLine = lines[span.closeLineIndex];
  const closeIndent = closeLine.match(LEADING_WHITESPACE_PATTERN)?.[0] ?? "";
  let entryIndent = "";
  for (let i = span.closeLineIndex - 1; i > span.openLineIndex; i--) {
    if (lines[i].trim() !== "") {
      entryIndent = lines[i].match(LEADING_WHITESPACE_PATTERN)?.[0] ?? "";
      break;
    }
  }
  if (entryIndent === "") {
    entryIndent = `${closeIndent}  `;
  }
  const updatedLines = [...lines];
  updatedLines.splice(span.closeLineIndex, 0, `${entryIndent}"${postId}",`);
  return updatedLines;
};

const appendPostToList = (
  lines: string[],
  span: ListSpan,
  postId: string,
): string => {
  if (splitFlowListEntries(joinSpannedLines(lines, span)).includes(postId)) {
    return lines.join("\n");
  }
  if (span.openLineIndex === span.closeLineIndex) {
    const updatedLines = [...lines];
    updatedLines[span.openLineIndex] = appendToInlineListLine(
      lines[span.openLineIndex],
      postId,
    );
    return updatedLines.join("\n");
  }
  return appendEntryBeforeFlowClose(lines, span, postId).join("\n");
};

const collectSectionSpans = (
  lines: string[],
  frontmatterEndIndex: number,
): SectionSpan[] => {
  const spans: SectionSpan[] = [];
  for (let i = 0; i < frontmatterEndIndex; i++) {
    const match = SECTION_TITLE_LINE_PATTERN.exec(lines[i]);
    if (match) {
      spans.push({
        title: parseQuotedValue(match[1]),
        titleLineIndex: i,
        endLineIndex: frontmatterEndIndex,
      });
    }
  }
  return spans.map((span, index) => ({
    ...span,
    endLineIndex:
      index + 1 < spans.length
        ? spans[index + 1].titleLineIndex
        : span.endLineIndex,
  }));
};

const locateFrontmatterBounds = (lines: string[]): number => {
  if (lines[0]?.trim() !== FRONTMATTER_DELIMITER) {
    throw new Error(
      "Unsupported songbook page format: file must start with YAML frontmatter.",
    );
  }
  const frontmatterEndIndex = lines.indexOf(FRONTMATTER_DELIMITER, 1);
  if (frontmatterEndIndex === -1) {
    throw new Error(
      "Unsupported songbook page format: frontmatter is never closed.",
    );
  }
  return frontmatterEndIndex;
};

export const addPostToSongbookPage = (
  pageContent: string,
  postId: string,
  sectionTitle?: string,
): string => {
  if (postId.trim() === "" || INVALID_POST_ID_PATTERN.test(postId)) {
    throw new Error(
      `Invalid post id "${postId}": expected a non-empty filename slug.`,
    );
  }
  const lines = pageContent.split("\n");
  const frontmatterEndIndex = locateFrontmatterBounds(lines);

  const requestedSection = sectionTitle?.trim();
  if (requestedSection) {
    const sections = collectSectionSpans(lines, frontmatterEndIndex);
    const targetSection = sections.find(
      (section) => section.title === requestedSection,
    );
    if (!targetSection) {
      const availableTitles =
        sections.map((section) => `"${section.title}"`).join(", ") || "(none)";
      throw new Error(
        `Songbook section "${requestedSection}" not found. Available sections: ${availableTitles}.`,
      );
    }
    const sectionPostsSpan = findFlowListSpan(
      lines,
      targetSection.titleLineIndex + 1,
      targetSection.endLineIndex,
      INDENTED_POSTS_LINE_PATTERN,
    );
    if (!sectionPostsSpan) {
      throw new Error(
        `Songbook section "${requestedSection}" has no posts list to extend.`,
      );
    }
    return appendPostToList(lines, sectionPostsSpan, postId);
  }

  const topLevelPostsSpan = findFlowListSpan(
    lines,
    1,
    frontmatterEndIndex,
    TOP_LEVEL_POSTS_LINE_PATTERN,
  );
  if (!topLevelPostsSpan) {
    throw new Error(
      "Songbook page frontmatter has no top-level posts list to extend.",
    );
  }
  return appendPostToList(lines, topLevelPostsSpan, postId);
};

export const updateSongbookPageFile = (
  input: SongbookPageUpdateInput,
  baseDir: string = process.cwd(),
): UpdatedSongbookPage => {
  const filePath = path.join(baseDir, SONGBOOK_PAGE_RELATIVE_PATH);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Songbook page not found at "${filePath}".`);
  }
  const originalContent = fs.readFileSync(filePath, "utf-8");
  const content = addPostToSongbookPage(
    originalContent,
    input.postId,
    input.sectionTitle,
  );
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf-8");
  }
  return { filePath, content };
};
