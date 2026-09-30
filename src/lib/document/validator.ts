import { FileValidationResult } from './types';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export class DocumentValidator {
  public static validateFile(
    fileName: string,
    fileSize: number,
    mimeType?: string,
    buffer?: Buffer
  ): FileValidationResult {
    // 1. Check file size presence & limit
    if (!fileSize || fileSize === 0) {
      return {
        isValid: false,
        error: 'The uploaded file is empty (0 bytes). Please upload a valid contract document.',
      };
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File size exceeds the 25MB limit (Current size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB).`,
      };
    }

    // 2. Check extension
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        error: `Unsupported file format '${ext}'. Only PDF (.pdf) and Word (.docx) contracts are allowed.`,
      };
    }

    // 3. Check MIME type if available
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType) && mimeType !== 'application/octet-stream') {
      return {
        isValid: false,
        error: `Invalid file content type (${mimeType}). Please upload a valid PDF or DOCX contract.`,
      };
    }

    // 4. Check buffer if provided
    if (buffer && buffer.length === 0) {
      return {
        isValid: false,
        error: 'File content buffer is empty or corrupted.',
      };
    }

    return { isValid: true };
  }
}
