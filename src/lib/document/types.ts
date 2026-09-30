export interface ExtractedPage {
  pageNumber: number;
  sectionTitle?: string;
  textContent: string;
}

export interface DocumentMetadata {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface DocumentExtractionResult {
  success: boolean;
  fullText: string;
  pages: ExtractedPage[];
  pageCount: number;
  metadata: DocumentMetadata;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}
