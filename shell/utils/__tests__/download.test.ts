import { generateZip, downloadUrl } from '@shell/utils/download';

const mockFile = jest.fn();
const mockGenerateAsync = jest.fn();

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file:          mockFile,
    generateAsync: mockGenerateAsync,
  }));
});

describe('fx: generateZip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds each file to the zip and resolves with the blob', async() => {
    const expectedBlob = new Blob(['zip']);

    mockGenerateAsync.mockResolvedValueOnce(expectedBlob);

    const files = {
      'a.txt': 'content a',
      'b.txt': 'content b',
    };

    const result = await generateZip(files);

    expect(mockFile).toHaveBeenCalledWith('a.txt', 'content a');
    expect(mockFile).toHaveBeenCalledWith('b.txt', 'content b');
    expect(result).toStrictEqual(expectedBlob);
  });

  it('calls generateAsync with blob type', async() => {
    mockGenerateAsync.mockResolvedValueOnce(new Blob([]));

    await generateZip({ 'file.txt': 'data' });

    expect(mockGenerateAsync).toHaveBeenCalledWith({ type: 'blob' });
  });

  it('generates a zip with no files when given an empty object', async() => {
    const emptyBlob = new Blob([]);

    mockGenerateAsync.mockResolvedValueOnce(emptyBlob);

    const result = await generateZip({});

    expect(mockFile).not.toHaveBeenCalled();
    expect(result).toStrictEqual(emptyBlob);
  });
});

describe('fx: downloadUrl', () => {
  afterEach(() => {
    // clean up any iframes added
    const existing = document.getElementById('__downloadIframe');

    if (existing) {
      existing.remove();
    }
    jest.restoreAllMocks();
  });

  it('creates a hidden iframe and sets its src to the url', () => {
    downloadUrl('https://example.com/file.csv');

    const iframe = document.getElementById('__downloadIframe') as HTMLIFrameElement;

    expect(iframe).not.toBeNull();
    expect(iframe.src).toContain('https://example.com/file.csv');
    expect(iframe.style.display).toStrictEqual('none');
  });

  it('reuses existing iframe on second call', () => {
    downloadUrl('https://example.com/file1.csv');
    downloadUrl('https://example.com/file2.csv');

    const iframes = document.querySelectorAll('#__downloadIframe');

    expect(iframes.length).toStrictEqual(1);
    expect((iframes[0] as HTMLIFrameElement).src).toContain('https://example.com/file2.csv');
  });

  it('uses the custom id when provided', () => {
    downloadUrl('https://example.com/report.zip', 'custom-frame');

    const iframe = document.getElementById('custom-frame') as HTMLIFrameElement;

    expect(iframe).not.toBeNull();
    expect(iframe.src).toContain('https://example.com/report.zip');

    iframe.remove();
  });
});
