import { AICitation } from '@/types';

/**
 * Text Chunking and Clause Extraction Module Architecture
 */

export interface ParsedDocumentChunk {
  chunkIndex: number;
  pageNumber: number;
  clauseNumber?: string;
  content: string;
}

export class DocumentExtractor {
  /**
   * Split contract text into page & clause-anchored chunks for LLM RAG indexing.
   */
  public static chunkDocumentText(rawText: string): ParsedDocumentChunk[] {
    if (!rawText) return [];
    
    // Simple structural split architecture placeholder for Step 2 PDF parser
    const paragraphs = rawText.split(/\n\n+/);
    return paragraphs.map((p, idx) => ({
      chunkIndex: idx,
      pageNumber: Math.floor(idx / 5) + 1,
      content: p.trim(),
    }));
  }

  /**
   * Build structured citation object for AI evidence.
   */
  public static buildCitation(
    documentId: string,
    documentTitle: string,
    pageNumber: number,
    clauseNumber: string,
    evidenceText: string
  ): AICitation {
    return {
      documentId,
      documentTitle,
      pageNumber,
      clauseNumber,
      evidenceText: evidenceText.trim(),
    };
  }
}
