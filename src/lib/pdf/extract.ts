import fs from "node:fs/promises";
import { getDocumentProxy, extractText } from "unpdf";

export interface ExtractedPdf {
  totalPages: number;
  pages: string[];
}

export async function extractPdfPages(filePath: string): Promise<ExtractedPdf> {
  const buffer = await fs.readFile(filePath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  return { totalPages, pages: text };
}
