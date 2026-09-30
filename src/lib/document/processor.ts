import { DocumentValidator } from './validator';
import { PDFParser } from './pdf-parser';
import { DOCXParser } from './docx-parser';
import { DocumentExtractionResult, ExtractedPage } from './types';

export class DocumentProcessor {
  public static async processFile(
    fileName: string,
    fileSize: number,
    mimeType: string,
    buffer: Buffer
  ): Promise<DocumentExtractionResult> {
    const metadata = { fileName, fileSize, mimeType };

    // 1. Validation
    const validation = DocumentValidator.validateFile(fileName, fileSize, mimeType, buffer);
    if (!validation.isValid) {
      return {
        success: false,
        fullText: '',
        pages: [],
        pageCount: 0,
        metadata,
        error: validation.error || 'Invalid file',
      };
    }

    try {
      const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
      let extracted: { fullText: string; pages: ExtractedPage[]; pageCount: number };

      if (ext === '.pdf' || mimeType === 'application/pdf') {
        extracted = await PDFParser.parsePDFBuffer(buffer);
      } else if (ext === '.docx' || mimeType.includes('wordprocessingml')) {
        extracted = await DOCXParser.parseDOCXBuffer(buffer);
      } else {
        return {
          success: false,
          fullText: '',
          pages: [],
          pageCount: 0,
          metadata,
          error: `Unsupported format '${ext}'. Please upload a valid PDF or DOCX file.`,
        };
      }

      // Check if extracted text is empty or corrupted
      const cleanFullText = extracted.fullText.trim();
      if (!cleanFullText || cleanFullText.length === 0) {
        return {
          success: false,
          fullText: '',
          pages: [],
          pageCount: 0,
          metadata,
          error: 'Document text extraction resulted in 0 readable characters. The document may be empty, image-only (scanned PDF), or password protected.',
        };
      }

      return {
        success: true,
        fullText: cleanFullText,
        pages: extracted.pages,
        pageCount: extracted.pageCount,
        metadata,
      };
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Document extraction error:', err);
      return {
        success: false,
        fullText: '',
        pages: [],
        pageCount: 0,
        metadata,
        error: e?.message || 'Failed to process and extract text from the document.',
      };
    }
  }
}
