import { getDocumentProxy, extractText } from "unpdf";

export interface ExtractedPdf {
  totalPages: number;
  pages: string[];
}

export async function extractPdfPages(buffer: Buffer): Promise<ExtractedPdf> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  return { totalPages, pages: text };
}
