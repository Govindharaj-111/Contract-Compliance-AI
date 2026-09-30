import { ExtractedPage } from './types';

interface PDFTextItem {
  str: string;
  transform: number[];
}

interface PDFTextContent {
  items: PDFTextItem[];
}

interface PDFPageData {
  pageIndex: number;
  getTextContent: () => Promise<PDFTextContent>;
}

export class PDFParser {
  public static async parsePDFBuffer(buffer: Buffer): Promise<{
    fullText: string;
    pages: ExtractedPage[];
    pageCount: number;
  }> {
    // Dynamic import for pdf-parse server execution
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const pageMap: Map<number, string> = new Map();

    // Custom pagerender to capture text page by page
    function customPageRender(pageData: PDFPageData) {
      return pageData.getTextContent().then((textContent: PDFTextContent) => {
        let lastY: number | null = null;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === null) {
            text += item.str + ' ';
          } else {
            text += '\n' + item.str + ' ';
          }
          lastY = item.transform[5];
        }

        const cleanPageText = text.replace(/[ \t]+/g, ' ').trim();
        pageMap.set(pageData.pageIndex + 1, cleanPageText);
        return cleanPageText;
      });
    }

    const data = await pdfParse(buffer, {
      pagerender: customPageRender,
    });

    const pageCount = data.numpages || pageMap.size || 1;
    const pages: ExtractedPage[] = [];
    let fullTextAcc = '';

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const pageText = pageMap.get(pageNum) || '';
      pages.push({
        pageNumber: pageNum,
        sectionTitle: `Page ${pageNum}`,
        textContent: pageText,
      });
      fullTextAcc += `--- Page ${pageNum} ---\n${pageText}\n\n`;
    }

    const finalFullText = fullTextAcc.trim() || data.text || '';

    return {
      fullText: finalFullText,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, sectionTitle: 'Page 1', textContent: finalFullText }],
      pageCount,
    };
  }
}
