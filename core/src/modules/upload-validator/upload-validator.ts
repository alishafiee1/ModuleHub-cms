const ZIP_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
]);

/**
 * Checks whether the uploaded file looks like a ZIP archive.
 * @param originalName - Original filename from client
 * @param mimeType - Multer-reported MIME type
 * @returns True when extension or MIME indicates ZIP
 */
export function isZipUpload(originalName: string, mimeType: string): boolean {
  const lowerName = originalName.toLowerCase();
  if (lowerName.endsWith('.zip')) {
    return true;
  }
  return ZIP_MIME_TYPES.has(mimeType);
}

/**
 * Checks the first ZIP signature bytes.
 * @param header - First bytes read from the uploaded file
 * @returns True when the header matches a ZIP archive signature
 */
export function hasZipMagicHeader(header: Buffer): boolean {
  if (header.length < 4) {
    return false;
  }
  const signature = header.subarray(0, 4).toString('binary');
  return signature === 'PK\x03\x04' || signature === 'PK\x05\x06' || signature === 'PK\x07\x08';
}

/**
 * Validates upload size against system maxZipUploadMb.
 * @param fileSizeBytes - Uploaded file size in bytes
 * @param maxZipUploadMb - Limit from system-settings
 * @returns Error message or null when within limit
 */
export function validateUploadSize(fileSizeBytes: number, maxZipUploadMb: number): string | null {
  const maxBytes = maxZipUploadMb * 1024 * 1024;
  if (fileSizeBytes > maxBytes) {
    return `ZIP exceeds maximum size of ${maxZipUploadMb} MB`;
  }
  return null;
}
