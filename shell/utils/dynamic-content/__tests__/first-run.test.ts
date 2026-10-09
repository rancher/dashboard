jest.mock('../config');
jest.mock('../util');

const DEFAULT_ENDPOINT = 'https://updates.rancher.io/rancher/$dist/updates';

const FEATURE = {
  id: 'navigation', title: 'Navigation', description: 'A new navigation'
};

const PRIME_PROMO = {
  title:       'Go Prime',
  description: 'Everything, plus support',
  products:    ['Rancher Manager', 'SUSE Storage'],
  cta:         { action: 'Explore', link: 'https://www.suse.com/products/rancher/' },
};

const DOCUMENT = `
version: 1
releases:
  - version: '2.16'
    whatsNew:
      - id: navigation
        title: Navigation
        description: A new navigation
    primePromo:
      title: Go Prime
      description: Everything, plus support
      products:
        - Rancher Manager
        - SUSE Storage
      cta:
        action: Explore
        link: https://www.suse.com/products/rancher/
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

  describe('firstRunPrimePromo', () => {
    const contentWith = (primePromo: any) => ({
      version:  1,
      releases: [{
        version: '2.16', whatsNew: [FEATURE], primePromo
      }]
    });

    it('should return the promotion of the version', () => {
      expect(firstRun.firstRunPrimePromo(contentWith(PRIME_PROMO), '2.16')).toStrictEqual(PRIME_PROMO);
    });

    it('should drop unknown fields of the promotion', () => {
      const promo = {
        ...PRIME_PROMO, icon: 'star', cta: { ...PRIME_PROMO.cta, style: 'link' }
      };

      expect(firstRun.firstRunPrimePromo(contentWith(promo), '2.16')).toStrictEqual(PRIME_PROMO);
    });

    it('should accept a promotion without products', () => {
      const promo = { ...PRIME_PROMO, products: [] };

      expect(firstRun.firstRunPrimePromo(contentWith(promo), '2.16')).toStrictEqual(promo);
    });

    it.each([
      ['no promotion', undefined],
      ['a promotion that is not an object', 'Go Prime'],
      ['no title', { ...PRIME_PROMO, title: undefined }],
      ['an empty description', { ...PRIME_PROMO, description: '' }],
      ['products that are not a list', { ...PRIME_PROMO, products: 'Rancher Manager' }],
      ['an empty product', { ...PRIME_PROMO, products: ['Rancher Manager', ''] }],
      ['no call to action', { ...PRIME_PROMO, cta: undefined }],
      ['a call to action without a label', { ...PRIME_PROMO, cta: { link: PRIME_PROMO.cta.link } }],
      ['an http link', { ...PRIME_PROMO, cta: { ...PRIME_PROMO.cta, link: 'http://www.suse.com' } }],
      ['a javascript link', { ...PRIME_PROMO, cta: { ...PRIME_PROMO.cta, link: 'javascript:alert(1)' } }],
      ['a relative link', { ...PRIME_PROMO, cta: { ...PRIME_PROMO.cta, link: '/home' } }],
    ])('should return undefined for %s', (_, promo) => {
      expect(firstRun.firstRunPrimePromo(contentWith(promo), '2.16')).toBeUndefined();
    });

    it('should return undefined when there is no release for the version', () => {
      expect(firstRun.firstRunPrimePromo(contentWith(PRIME_PROMO), '2.17')).toBeUndefined();
    });
  });

  describe('fetchFirstRunContent', () => {
    it('should return the content of the fetched document', async() => {
      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({ features: [FEATURE], primePromo: PRIME_PROMO });
    });

    it('should use each part of the document on its own', async() => {
      axios.mockResolvedValue({
        data: JSON.stringify({
          version:  1,
          releases: [{
            version: '2.16', whatsNew: [FEATURE], primePromo: { title: 'Go Prime' }
          }]
        })
      });

      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({ features: [FEATURE], primePromo: undefined });
    });

    it('should fetch the document without credentials', async() => {
      await firstRun.fetchFirstRunContent(getters, axios, '2.16');

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
      axios.mockResolvedValue({
        data: JSON.stringify({
          version:  1,
          releases: [{
            version: '2.16', whatsNew: [FEATURE], primePromo: PRIME_PROMO
          }]
        })
      });

      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({ features: [FEATURE], primePromo: PRIME_PROMO });
    });

    it('should not fetch the document when dynamic content is disabled', async() => {
      mockGetConfig.mockReturnValue({
        enabled: false, debug: false, log: false, endpoint: DEFAULT_ENDPOINT, prime: true, distribution: 'prime'
      });

      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({});
      expect(axios).toHaveBeenCalledTimes(0);
    });

    it('should use the built-in content when the document cannot be fetched', async() => {
      const error = new Error('Forbidden');

      axios.mockRejectedValue(error);

      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({});
      expect(mockLogger.info).toHaveBeenCalledWith('Unable to fetch the release welcome content, using the built-in content', error);
    });

    it('should use the built-in content when the document is not valid YAML', async() => {
      axios.mockResolvedValue({ data: 'releases: [' });

      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({});
    });

    it.each([
      ['an empty document', ''],
      ['no response data', undefined],
    ])('should use the built-in content for %s', async(_, data) => {
      axios.mockResolvedValue({ data });

      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({ features: undefined, primePromo: undefined });
    });

    it('should log when the document has no content for the version', async() => {
      await firstRun.fetchFirstRunContent(getters, axios, '2.17');

      expect(mockLogger.info).toHaveBeenCalledWith('No valid release welcome content for 2.17 in https://updates.rancher.io/rancher/community/first-run, using the built-in content');
    });

    it('should log when the document has no Prime promotion for the version', async() => {
      await firstRun.fetchFirstRunContent(getters, axios, '2.17');

      expect(mockLogger.info).toHaveBeenCalledWith('No valid Prime promotion for 2.17 in https://updates.rancher.io/rancher/community/first-run, using the built-in content');
    });

    it('should fetch the document once per session', async() => {
      await firstRun.fetchFirstRunContent(getters, axios, '2.16');
      await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('should not fetch the document again after a failure', async() => {
      axios.mockRejectedValue(new Error('Forbidden'));

      await firstRun.fetchFirstRunContent(getters, axios, '2.16');
      await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(axios).toHaveBeenCalledTimes(1);
    });
  });
});
