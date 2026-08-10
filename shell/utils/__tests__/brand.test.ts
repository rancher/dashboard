import { getBrandMeta } from '@shell/utils/brand';
import { requireJson } from '@shell/utils/require-asset';

jest.mock('@shell/utils/require-asset', () => ({ requireJson: jest.fn() }));

const mockRequireJson = requireJson as jest.Mock;

describe('fx: getBrandMeta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty object when brand is empty string', () => {
    const result = getBrandMeta('');

    expect(result).toStrictEqual({});
    expect(mockRequireJson).not.toHaveBeenCalled();
  });

  it('returns empty object when brand is falsy null-like (via coercion)', () => {
    // empty string is falsy — requireJson should not be called
    const result = getBrandMeta('');

    expect(result).toStrictEqual({});
  });

  it('returns brand meta when requireJson succeeds', () => {
    const meta = {
      hasStylesheet: 'brand.css',
      banner:        { textAlign: 'center' },
    };

    mockRequireJson.mockReturnValueOnce(meta);

    const result = getBrandMeta('suse');

    expect(result).toStrictEqual(meta);
    expect(mockRequireJson).toHaveBeenCalledWith('~shell/assets/brand/suse/metadata.json');
  });

  it('returns empty object when requireJson throws (metadata not found)', () => {
    mockRequireJson.mockImplementationOnce(() => {
      throw new Error('Cannot find module');
    });

    const result = getBrandMeta('unknown-brand');

    expect(result).toStrictEqual({});
  });

  it('passes the brand string into the correct metadata path', () => {
    mockRequireJson.mockReturnValueOnce({});

    getBrandMeta('harvester');

    expect(mockRequireJson).toHaveBeenCalledWith('~shell/assets/brand/harvester/metadata.json');
  });

  it.each([
    {
      desc:  'meta with only hasStylesheet',
      brand: 'suse',
      meta:  { hasStylesheet: 'brand.css' },
    },
    {
      desc:  'meta with only banner',
      brand: 'rancher',
      meta:  { banner: { textAlign: 'left' } },
    },
    {
      desc:  'meta with all fields',
      brand: 'harvester',
      meta:  {
        hasStylesheet: 'style.css',
        banner:        { textAlign: 'right' },
      },
    },
    {
      desc:  'empty meta object',
      brand: 'csp',
      meta:  {},
    },
  ])('returns correct meta for $desc', ({ brand, meta }) => {
    mockRequireJson.mockReturnValueOnce(meta);

    expect(getBrandMeta(brand)).toStrictEqual(meta);
  });
});
