export type ExtractedDocument = {
  text: string;
  metadata: {
    parser: string;
    characterCount: number;
  };
};

export async function extractTextFromBuffer(file: {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}): Promise<ExtractedDocument> {
  if (file.mimeType === "text/plain" || file.filename.endsWith(".md")) {
    const text = file.buffer.toString("utf8");
    return { text, metadata: { parser: "plain-text", characterCount: text.length } };
  }

  throw new Error(
    `Parser SDK not installed in lightweight preview mode: ${file.mimeType || file.filename}`,
  );
}
