jest.mock('../config');
jest.mock('../util');

const DEFAULT_ENDPOINT = 'https://updates.rancher.io/rancher/$dist/updates';

const FEATURE = {
  id: 'navigation', title: 'Navigation', description: 'A new navigation'
};

const DOCUMENT = `
version: 1
releases:
  - version: '2.16'
    whatsNew:
      - id: navigation
        title: Navigation
        description: A new navigation
`;

describe('dynamic content: first-run', () => {
  // The module caches the requests, so it's loaded again for every test
  let firstRun: typeof import('../first-run');
  let mockGetConfig: jest.Mock;
  let mockLogger: any;
  let axios: jest.Mock;
  const getters = {};

  beforeEach(() => {
    jest.resetModules();
    firstRun = require('../first-run');
    mockGetConfig = require('../config').getConfig;
    mockLogger = {
      debug: jest.fn(), info: jest.fn(), error: jest.fn()
    };
    require('../util').createLogger.mockReturnValue(mockLogger);
    mockGetConfig.mockReturnValue({
      enabled: true, debug: false, log: false, endpoint: DEFAULT_ENDPOINT, prime: false, distribution: 'community'
    });
    axios = jest.fn().mockResolvedValue({ data: DOCUMENT });
  });

  describe('firstRunUrl', () => {
    it.each([
      ['the default community endpoint', DEFAULT_ENDPOINT, 'community', 'https://updates.rancher.io/rancher/community/first-run'],
      ['the default prime endpoint', DEFAULT_ENDPOINT, 'prime', 'https://updates.rancher.io/rancher/prime/first-run'],
      ['a custom endpoint', 'https://mirror.example.com/content/updates', 'prime', 'https://mirror.example.com/content/first-run'],
      ['a custom endpoint ending with a slash', 'https://mirror.example.com/content/', 'prime', 'https://mirror.example.com/content/first-run'],
    ])('should place the document next to %s', (_, endpoint, distribution, expected) => {
      expect(firstRun.firstRunUrl(endpoint, distribution)).toStrictEqual(expected);
    });
  });

  describe('firstRunFeatures', () => {
    it('should return the features of the version', () => {
      const content = { version: 1, releases: [{ version: '2.15', whatsNew: [] }, { version: '2.16', whatsNew: [FEATURE] }] };

      expect(firstRun.firstRunFeatures(content, '2.16')).toStrictEqual([FEATURE]);
    });

    it('should drop unknown fields of the features', () => {
      const content = { version: 1, releases: [{ version: '2.16', whatsNew: [{ ...FEATURE, icon: 'star' }] }] };

      expect(firstRun.firstRunFeatures(content, '2.16')).toStrictEqual([FEATURE]);
    });

    it('should return an empty list when the version has no features', () => {
      const content = { version: 1, releases: [{ version: '2.16', whatsNew: [] }] };

      expect(firstRun.firstRunFeatures(content, '2.16')).toStrictEqual([]);
    });

    it.each([
      ['no content', undefined],
      ['no releases', { version: 1 }],
      ['releases that are not a list', { version: 1, releases: 'invalid' }],
      ['no release for the version', { version: 1, releases: [{ version: '2.15', whatsNew: [FEATURE] }] }],
      ['a numeric version', { version: 1, releases: [{ version: 2.16, whatsNew: [FEATURE] }] }],
      ['no features', { version: 1, releases: [{ version: '2.16' }] }],
      ['features that are not a list', { version: 1, releases: [{ version: '2.16', whatsNew: FEATURE }] }],
      ['a feature without a title', { version: 1, releases: [{ version: '2.16', whatsNew: [FEATURE, { id: 'tables', description: 'Tables' }] }] }],
      ['a feature with an empty description', { version: 1, releases: [{ version: '2.16', whatsNew: [{ ...FEATURE, description: '' }] }] }],
      ['a feature that is not an object', { version: 1, releases: [{ version: '2.16', whatsNew: ['Navigation'] }] }],
      ['a null release', { version: 1, releases: [null] }],
    ])('should return undefined for %s', (_, content) => {
      expect(firstRun.firstRunFeatures(content as any, '2.16')).toBeUndefined();
    });
  });

  describe('fetchFirstRunFeatures', () => {
    it('should return the features of the fetched document', async() => {
      const features = await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(features).toStrictEqual([FEATURE]);
    });

    it('should fetch the document without credentials', async() => {
      await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(axios).toHaveBeenCalledWith({
        url:             'https://updates.rancher.io/rancher/community/first-run',
        method:          'get',
        timeout:         3000,
        noApiCsrf:       true,
        withCredentials: false,
        signal:          expect.any(AbortSignal),
        responseType:    'text'
      });
    });

    it('should accept a JSON document', async() => {
      axios.mockResolvedValue({ data: JSON.stringify({ version: 1, releases: [{ version: '2.16', whatsNew: [FEATURE] }] }) });

      const features = await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(features).toStrictEqual([FEATURE]);
    });

    it('should not fetch the document when dynamic content is disabled', async() => {
      mockGetConfig.mockReturnValue({
        enabled: false, debug: false, log: false, endpoint: DEFAULT_ENDPOINT, prime: true, distribution: 'prime'
      });

      const features = await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(features).toBeUndefined();
      expect(axios).toHaveBeenCalledTimes(0);
    });

    it('should return undefined when the document cannot be fetched', async() => {
      const error = new Error('Forbidden');

      axios.mockRejectedValue(error);

      const features = await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(features).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Unable to fetch the release welcome content, using the built-in content', error);
    });

    it('should return undefined when the document is not valid YAML', async() => {
      axios.mockResolvedValue({ data: 'releases: [' });

      const features = await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(features).toBeUndefined();
    });

    it.each([
      ['an empty document', ''],
      ['no response data', undefined],
    ])('should return undefined for %s', async(_, data) => {
      axios.mockResolvedValue({ data });

      const features = await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(features).toBeUndefined();
    });

    it('should log when the document has no content for the version', async() => {
      await firstRun.fetchFirstRunFeatures(getters, axios, '2.17');

      expect(mockLogger.info).toHaveBeenCalledWith('No valid release welcome content for 2.17 in https://updates.rancher.io/rancher/community/first-run, using the built-in content');
    });

    it('should fetch the document once per session', async() => {
      await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');
      await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('should not fetch the document again after a failure', async() => {
      axios.mockRejectedValue(new Error('Forbidden'));

      await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');
      await firstRun.fetchFirstRunFeatures(getters, axios, '2.16');

      expect(axios).toHaveBeenCalledTimes(1);
    });
  });
});
