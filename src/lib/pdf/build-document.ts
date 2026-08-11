import type { ExtractedPdf } from "./extract";

export function buildPageDelimitedDocument(label: string, extracted: ExtractedPdf): string {
  const pageBlocks = extracted.pages.map(
    (pageText, index) => `=== ${label} PAGE ${index + 1} ===\n${pageText.trim()}`
  );
  return pageBlocks.join("\n\n");
}
