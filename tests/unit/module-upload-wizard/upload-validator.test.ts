import { isZipUpload, validateUploadSize } from '../../../core/src/modules/upload-validator';

describe('upload-validator', () => {
  it('accepts .zip extension', () => {
    expect(isZipUpload('site.zip', 'application/octet-stream')).toBe(true);
  });

  it('rejects non-ZIP filename and mime', () => {
    expect(isZipUpload('site.tar.gz', 'application/gzip')).toBe(false);
  });

  it('returns null when size within limit', () => {
    expect(validateUploadSize(1024, 200)).toBeNull();
  });

  it('returns error when size exceeds maxZipUploadMb', () => {
    const over = 201 * 1024 * 1024;
    expect(validateUploadSize(over, 200)).toMatch(/exceeds/);
  });
});
