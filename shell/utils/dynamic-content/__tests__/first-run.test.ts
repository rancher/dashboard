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

const REGISTRATION = {
  title:       'Register',
  description: 'Registering unlocks:',
  benefits:    [
    { text: 'Support', link: { action: 'Support handbook', link: 'https://www.suse.com/support/handbook/' } },
    { text: 'Images' },
  ],
  cta: { action: 'Open SUSE Customer Center', link: 'https://scc.suse.com/' },
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

  describe('firstRunVersions', () => {
    it.each([
      ['an exact version', '2.16.1', ['2.16.1', '2.16']],
      ['a minor version', '2.16', ['2.16']],
    ])('should look up %s', (_, version, expected) => {
      expect(firstRun.firstRunVersions(version)).toStrictEqual(expected);
    });
  });

  describe('firstRunRegistration', () => {
    const contentWith = (registration: any) => ({ version: 1, releases: [{ version: '2.16', registration }] });

    it('should return the registration card of the version', () => {
      expect(firstRun.firstRunRegistration(contentWith(REGISTRATION), '2.16.0')).toStrictEqual(REGISTRATION);
    });

    it('should drop unknown fields of the card', () => {
      const registration = {
        ...REGISTRATION, icon: 'star', benefits: [{ ...REGISTRATION.benefits[0], icon: 'star' }, REGISTRATION.benefits[1]]
      };

      expect(firstRun.firstRunRegistration(contentWith(registration), '2.16.0')).toStrictEqual(REGISTRATION);
    });

    it.each([
      ['no card', undefined],
      ['no title', { ...REGISTRATION, title: undefined }],
      ['an empty description', { ...REGISTRATION, description: '' }],
      ['benefits that are not a list', { ...REGISTRATION, benefits: 'Support' }],
      ['a benefit without text', { ...REGISTRATION, benefits: [{ link: REGISTRATION.cta }] }],
      ['a benefit with an http link', { ...REGISTRATION, benefits: [{ text: 'Support', link: { action: 'Read', link: 'http://www.suse.com' } }] }],
      ['a benefit link without a label', { ...REGISTRATION, benefits: [{ text: 'Support', link: { link: 'https://www.suse.com' } }] }],
      ['no call to action', { ...REGISTRATION, cta: undefined }],
      ['a javascript call to action', { ...REGISTRATION, cta: { action: 'Open', link: 'javascript:alert(1)' } }],
    ])('should return undefined for %s', (_, registration) => {
      expect(firstRun.firstRunRegistration(contentWith(registration), '2.16.0')).toBeUndefined();
    });
  });

  describe('hasExactFirstRunRelease', () => {
    beforeEach(() => {
      axios.mockResolvedValue({ data: JSON.stringify({ version: 1, releases: [{ version: '2.16', whatsNew: [] }, { version: '2.16.1', whatsNew: [] }] }) });
    });

    it.each([
      ['an exact version with an entry', '2.16.1', true],
      ['an exact version without an entry', '2.16.2', false],
      ['a minor version', '2.16', false],
    ])('should report %s', async(_, version, expected) => {
      expect(await firstRun.hasExactFirstRunRelease(getters, axios, version)).toStrictEqual(expected);
    });

    it('should not fetch the document for a minor version', async() => {
      await firstRun.hasExactFirstRunRelease(getters, axios, '2.16');

      expect(axios).toHaveBeenCalledTimes(0);
    });

    it('should report no entry when the document cannot be fetched', async() => {
      axios.mockRejectedValue(new Error('Forbidden'));

      expect(await firstRun.hasExactFirstRunRelease(getters, axios, '2.16.1')).toStrictEqual(false);
    });

    it('should share the request with the modal content', async() => {
      await firstRun.hasExactFirstRunRelease(getters, axios, '2.16.1');
      await firstRun.fetchFirstRunContent(getters, axios, '2.16.1');

      expect(axios).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchFirstRunContent', () => {
    it('should return the content of the fetched document', async() => {
      const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16');

      expect(content).toStrictEqual({
        features: [FEATURE], matchedVersion: '2.16', primePromo: PRIME_PROMO
      });
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

      expect(content).toStrictEqual({
        features: [FEATURE], matchedVersion: '2.16', primePromo: undefined
      });
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

      expect(content).toStrictEqual({
        features: [FEATURE], matchedVersion: '2.16', primePromo: PRIME_PROMO
      });
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

      expect(content).toStrictEqual({
        features: undefined, matchedVersion: undefined, primePromo: undefined
      });
    });

    it('should log the parts with no content for the version', async() => {
      await firstRun.fetchFirstRunContent(getters, axios, '2.17.0');

      expect(mockLogger.info).toHaveBeenCalledWith('No valid whatsNew, primePromo for 2.17.0 in https://updates.rancher.io/rancher/community/first-run, using the built-in content');
    });

    it('should not log when every part has content', async() => {
      await firstRun.fetchFirstRunContent(getters, axios, '2.16.0');

      expect(mockLogger.info).toHaveBeenCalledTimes(0);
    });

    describe('with an exact version', () => {
      const PATCH_FEATURE = {
        id: 'patch', title: 'Patch', description: 'Only for 2.16.1'
      };

      beforeEach(() => {
        axios.mockResolvedValue({
          data: JSON.stringify({
            version:  1,
            releases: [
              {
                version: '2.16', whatsNew: [FEATURE], primePromo: PRIME_PROMO
              },
              { version: '2.16.1', whatsNew: [PATCH_FEATURE] },
            ]
          })
        });
      });

      it('should use the exact version first', async() => {
        const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16.1');

        expect(content.features).toStrictEqual([PATCH_FEATURE]);
      });

      it('should report the exact version it used', async() => {
        const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16.1');

        expect(content.matchedVersion).toStrictEqual('2.16.1');
      });

      it('should use the minor version for the parts the exact version does not have', async() => {
        const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16.1');

        expect(content.primePromo).toStrictEqual(PRIME_PROMO);
      });

      it('should fall back to the minor version for other patches', async() => {
        const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16.2');

        expect(content).toStrictEqual({
          features: [FEATURE], matchedVersion: '2.16', primePromo: PRIME_PROMO
        });
      });

      it('should fall back to the minor version when the exact version is invalid', async() => {
        axios.mockResolvedValue({
          data: JSON.stringify({
            version:  1,
            releases: [
              { version: '2.16', whatsNew: [FEATURE] },
              { version: '2.16.1', whatsNew: [{ id: 'patch' }] },
            ]
          })
        });

        const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16.1');

        expect(content.features).toStrictEqual([FEATURE]);
      });
    });

    describe('on Prime', () => {
      beforeEach(() => {
        mockGetConfig.mockReturnValue({
          enabled: true, debug: false, log: false, endpoint: DEFAULT_ENDPOINT, prime: true, distribution: 'prime'
        });
        axios.mockResolvedValue({
          data: JSON.stringify({
            version:  1,
            releases: [{
              version: '2.16', whatsNew: [FEATURE], primePromo: PRIME_PROMO, registration: REGISTRATION
            }]
          })
        });
      });

      it('should fetch the Prime document', async() => {
        await firstRun.fetchFirstRunContent(getters, axios, '2.16.0');

        expect(axios).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://updates.rancher.io/rancher/prime/first-run' }));
      });

      it('should return the registration card and not the Prime promotion', async() => {
        const content = await firstRun.fetchFirstRunContent(getters, axios, '2.16.0');

        expect(content).toStrictEqual({
          features: [FEATURE], matchedVersion: '2.16', registration: REGISTRATION
        });
      });

      it('should log the Prime parts with no content for the version', async() => {
        await firstRun.fetchFirstRunContent(getters, axios, '2.17.0');

        expect(mockLogger.info).toHaveBeenCalledWith('No valid whatsNew, registration for 2.17.0 in https://updates.rancher.io/rancher/prime/first-run, using the built-in content');
      });
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
