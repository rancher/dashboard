import { getIndividualBanners, overlayIndividualBanners } from '@shell/utils/banners';

describe('banners', () => {
  describe('getIndividualBanners', () => {
    it('returns an empty object when no settings match', () => {
      const store = { getters: { 'management/all': () => [] } };

      expect(getIndividualBanners(store)).toStrictEqual({});
    });

    it('ignores settings without a value', () => {
      const store = {
        getters: {
          'management/all': () => [
            {
              id:    'ui-banner-header',
              value: '',
            },
          ],
        },
      };

      expect(getIndividualBanners(store)).toStrictEqual({});
    });

    it('ignores settings not in the known banner id list', () => {
      const store = {
        getters: {
          'management/all': () => [
            {
              id:    'ui-some-other-setting',
              value: 'some-value',
            },
          ],
        },
      };

      expect(getIndividualBanners(store)).toStrictEqual({});
    });

    it.each([
      {
        desc:        'maps ui-banner-header to bannerHeader',
        id:          'ui-banner-header',
        expectedKey: 'bannerHeader',
      },
      {
        desc:        'maps ui-banner-footer to bannerFooter',
        id:          'ui-banner-footer',
        expectedKey: 'bannerFooter',
      },
      {
        desc:        'maps ui-banner-login-consent to bannerConsent',
        id:          'ui-banner-login-consent',
        expectedKey: 'bannerConsent',
      },
    ])('$desc', ({ id, expectedKey }) => {
      const setting = {
        id,
        value: '{"text":"hello"}',
      };
      const store = { getters: { 'management/all': () => [setting] } };
      const result = getIndividualBanners(store);

      expect(Object.keys(result)).toStrictEqual([expectedKey]);
      expect(result[expectedKey]).toStrictEqual(setting);
    });

    it('collects multiple matching banner settings', () => {
      const headerSetting = {
        id:    'ui-banner-header',
        value: '{"text":"header"}',
      };
      const footerSetting = {
        id:    'ui-banner-footer',
        value: '{"text":"footer"}',
      };
      const store = { getters: { 'management/all': () => [headerSetting, footerSetting] } };
      const result = getIndividualBanners(store);

      expect(result['bannerHeader']).toStrictEqual(headerSetting);
      expect(result['bannerFooter']).toStrictEqual(footerSetting);
    });
  });

  describe('overlayIndividualBanners', () => {
    it('does nothing when banners object is empty', () => {
      const parsedBanner = { showHeader: 'false' };

      overlayIndividualBanners(parsedBanner, {});
      expect(parsedBanner).toStrictEqual({ showHeader: 'false' });
    });

    it('overlays bannerHeader and sets showHeader to true', () => {
      const parsedBanner: Record<string, unknown> = {};
      const banners = { bannerHeader: { value: '{"text":"Top banner","color":"#fff"}' } };

      overlayIndividualBanners(parsedBanner, banners);

      expect(parsedBanner['bannerHeader']).toStrictEqual({ text: 'Top banner', color: '#fff' });
      expect(parsedBanner['showHeader']).toStrictEqual('true');
    });

    it('overlays bannerFooter and sets showFooter to true', () => {
      const parsedBanner: Record<string, unknown> = {};
      const banners = { bannerFooter: { value: '{"text":"Footer"}' } };

      overlayIndividualBanners(parsedBanner, banners);

      expect(parsedBanner['bannerFooter']).toStrictEqual({ text: 'Footer' });
      expect(parsedBanner['showFooter']).toStrictEqual('true');
    });

    it('overlays bannerConsent and sets showConsent to true', () => {
      const parsedBanner: Record<string, unknown> = {};
      const banners = { bannerConsent: { value: '{"text":"Consent"}' } };

      overlayIndividualBanners(parsedBanner, banners);

      expect(parsedBanner['bannerConsent']).toStrictEqual({ text: 'Consent' });
      expect(parsedBanner['showConsent']).toStrictEqual('true');
    });

    it('overlays multiple banners at once', () => {
      const parsedBanner: Record<string, unknown> = {};
      const banners = {
        bannerHeader:  { value: '{"text":"Header"}' },
        bannerFooter:  { value: '{"text":"Footer"}' },
        bannerConsent: { value: '{"text":"Consent"}' },
      };

      overlayIndividualBanners(parsedBanner, banners);

      expect(parsedBanner['bannerHeader']).toStrictEqual({ text: 'Header' });
      expect(parsedBanner['bannerFooter']).toStrictEqual({ text: 'Footer' });
      expect(parsedBanner['bannerConsent']).toStrictEqual({ text: 'Consent' });
      expect(parsedBanner['showHeader']).toStrictEqual('true');
      expect(parsedBanner['showFooter']).toStrictEqual('true');
      expect(parsedBanner['showConsent']).toStrictEqual('true');
    });

    it('silently skips a banner with invalid JSON value', () => {
      const parsedBanner: Record<string, unknown> = { existing: 'value' };
      const banners = { bannerHeader: { value: 'not-valid-json{{{' } };

      overlayIndividualBanners(parsedBanner, banners);

      expect(parsedBanner).toStrictEqual({ existing: 'value' });
    });

    it('skips invalid banner but still processes valid ones', () => {
      const parsedBanner: Record<string, unknown> = {};
      const banners = {
        bannerHeader: { value: 'bad json' },
        bannerFooter: { value: '{"text":"Footer"}' },
      };

      overlayIndividualBanners(parsedBanner, banners);

      expect(parsedBanner['bannerHeader']).toBeUndefined();
      expect(parsedBanner['showHeader']).toBeUndefined();
      expect(parsedBanner['bannerFooter']).toStrictEqual({ text: 'Footer' });
      expect(parsedBanner['showFooter']).toStrictEqual('true');
    });

    it('overwrites existing parsedBanner field when overlaying', () => {
      const parsedBanner: Record<string, unknown> = { bannerHeader: { text: 'Old' }, showHeader: 'false' };
      const banners = { bannerHeader: { value: '{"text":"New"}' } };

      overlayIndividualBanners(parsedBanner, banners);

      expect(parsedBanner['bannerHeader']).toStrictEqual({ text: 'New' });
      expect(parsedBanner['showHeader']).toStrictEqual('true');
    });
  });
});
