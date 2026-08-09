import {
  createSongbookPostFile,
  type SongbookPostInput,
} from "@/lib/createSongbookPost";

const input: SongbookPostInput = {
  filename: process.env.INPUT_FILENAME || process.argv[2] || "",
  title: process.env.INPUT_TITLE || undefined,
  date: process.env.INPUT_DATE || undefined,
  image: process.env.INPUT_IMAGE || process.argv[3] || "",
  imageAlt: process.env.INPUT_IMAGE_ALT || undefined,
  imageDimensions: process.env.INPUT_IMAGE_DIMENSIONS || process.argv[4] || "",
  imagePlacement:
    process.env.INPUT_IMAGE_PLACEMENT || process.argv[5] || "header",
  imageLink: process.env.INPUT_IMAGE_LINK || undefined,
  orientation: process.env.INPUT_ORIENTATION || undefined,
  metaTitle: process.env.INPUT_META_TITLE || undefined,
  additionalStyling: process.env.INPUT_ADDITIONAL_STYLING || undefined,
  content: process.env.INPUT_CONTENT || undefined,
};

if (!input.filename) {
  console.error("Error: 'filename' input is required.");
  process.exit(1);
}

if (!input.image) {
  console.error("Error: 'image' input is required.");
  process.exit(1);
}

if (!input.imageDimensions) {
  console.error("Error: 'imageDimensions' input is required.");
  process.exit(1);
}

try {
  const result = createSongbookPostFile(input);
  console.log(`Successfully created songbook post at: ${result.filePath}`);
} catch (error) {
  console.error("Error creating songbook post:", error);
  process.exit(1);
}
