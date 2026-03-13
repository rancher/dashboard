import { toContextKey, requireAsset, requireJson, _setContexts } from '@shell/utils/require-asset';

describe('fx: toContextKey', () => {
  it.each([
    ['~shell/assets/images/providers/aws.svg', './images/providers/aws.svg'],
    ['@shell/assets/images/providers/aws.svg', './images/providers/aws.svg'],
    ['~shell/assets/brand/suse/metadata.json', './brand/suse/metadata.json'],
    ['@shell/assets/images/pl/dark/logo.svg', './images/pl/dark/logo.svg'],
  ])('should convert %s to %s', (input, expected) => {
    expect(toContextKey(input)).toStrictEqual(expected);
  });

  it('should prepend ./ to paths without shell prefix', () => {
    expect(toContextKey('images/providers/aws.svg')).toStrictEqual('./images/providers/aws.svg');
  });
});

describe('fx: requireAsset', () => {
  afterEach(() => {
    _setContexts(null, null);
  });

  it('should return the resolved asset URL from the image context', () => {
    const mockImgCtx = jest.fn().mockReturnValue('/static/images/aws.svg');

    _setContexts(mockImgCtx, null);

    const result = requireAsset('~shell/assets/images/providers/aws.svg');

    expect(result).toStrictEqual('/static/images/aws.svg');
    expect(mockImgCtx).toHaveBeenCalledWith('./images/providers/aws.svg');
  });

  it('should throw when the image context is not available', () => {
    _setContexts(null, null);

    expect(() => requireAsset('~shell/assets/images/foo.svg'))
      .toThrow('Asset context not available for: ~shell/assets/images/foo.svg');
  });

  it('should propagate errors from the context function for missing assets', () => {
    const mockImgCtx = jest.fn().mockImplementation(() => {
      throw new Error('Cannot find module');
    });

    _setContexts(mockImgCtx, null);

    expect(() => requireAsset('~shell/assets/images/missing.svg'))
      .toThrow('Cannot find module');
  });
});

describe('fx: requireJson', () => {
  afterEach(() => {
    _setContexts(null, null);
  });

  it('should return mod.default when available', () => {
    const jsonData = { vendor: 'suse' };
    const mockJsonCtx = jest.fn().mockReturnValue({ default: jsonData });

    _setContexts(null, mockJsonCtx);

    const result = requireJson('~shell/assets/brand/suse/metadata.json');

    expect(result).toStrictEqual(jsonData);
    expect(mockJsonCtx).toHaveBeenCalledWith('./brand/suse/metadata.json');
  });

  it('should return mod directly when no default export', () => {
    const jsonData = { vendor: 'rancher' };
    const mockJsonCtx = jest.fn().mockReturnValue(jsonData);

    _setContexts(null, mockJsonCtx);

    const result = requireJson('~shell/assets/brand/rancher/metadata.json');

    expect(result).toStrictEqual(jsonData);
  });

  it('should throw when the JSON context is not available', () => {
    _setContexts(null, null);

    expect(() => requireJson('~shell/assets/brand/suse/metadata.json'))
      .toThrow('JSON context not available for: ~shell/assets/brand/suse/metadata.json');
  });

  it('should propagate errors from the context function for missing files', () => {
    const mockJsonCtx = jest.fn().mockImplementation(() => {
      throw new Error('Cannot find module');
    });

    _setContexts(null, mockJsonCtx);

    expect(() => requireJson('~shell/assets/brand/missing/metadata.json'))
      .toThrow('Cannot find module');
  });
});
