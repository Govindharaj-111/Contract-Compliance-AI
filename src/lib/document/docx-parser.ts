import mammoth from 'mammoth';
import { ExtractedPage } from './types';

export class DOCXParser {
  public static async parseDOCXBuffer(buffer: Buffer): Promise<{
    fullText: string;
    pages: ExtractedPage[];
    pageCount: number;
  }> {
    // Extract raw text with section / paragraph breaks
    const rawResult = await mammoth.extractRawText({ buffer });
    const fullText = rawResult.value.replace(/\r\n/g, '\n').trim();

    if (!fullText) {
      return {
        fullText: '',
        pages: [],
        pageCount: 0,
      };
    }

    // Split text into logical section/page blocks (approx. 3000 chars or paragraph splits)
    const paragraphs = fullText.split(/\n{2,}/);
    const pages: ExtractedPage[] = [];
    
    let currentBlock = '';
    let pageNum = 1;

    for (const p of paragraphs) {
      const trimmed = p.trim();
      if (!trimmed) continue;

      if ((currentBlock + '\n\n' + trimmed).length > 2500 && currentBlock.length > 0) {
        pages.push({
          pageNumber: pageNum,
          sectionTitle: `Section ${pageNum}`,
          textContent: currentBlock.trim(),
        });
        pageNum++;
        currentBlock = trimmed;
      } else {
        currentBlock = currentBlock ? `${currentBlock}\n\n${trimmed}` : trimmed;
      }
    }

    if (currentBlock.trim()) {
      pages.push({
        pageNumber: pageNum,
        sectionTitle: `Section ${pageNum}`,
        textContent: currentBlock.trim(),
      });
    }

    return {
      fullText,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, sectionTitle: 'Section 1', textContent: fullText }],
      pageCount: pages.length || 1,
    };
  }
}
