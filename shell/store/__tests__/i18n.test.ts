// The i18n store imports the en-us YAML at module load time; provide a stub so
// Jest does not fail trying to parse the raw YAML file.
import {
  state,
  getters,
  mutations,
  actions,
} from '@shell/store/i18n';

jest.mock('@shell/assets/translations/en-us.yaml', () => ({}));

// The NONE constant is not exported; mirror its value used in the source
const NONE = 'none';

// A controlled translation set used across tests.
// Keys are nested objects matching the shape expected by `get(obj, 'dotted.path')`.
function makeTranslations() {
  return {
    'en-us': {
      locale:       { 'en-us': 'English', 'zh-hans': 'Chinese Simplified' },
      greeting:     'Hello',
      farewell:     'Goodbye',
      template:     { message: 'Found {count} items' },
      nested:       { deep: { key: 'Deep Value' } },
      'object-msg': { key1: 'val1', key2: 'val2' }, // object value - t() returns undefined for these
    },
    'zh-hans': {
      greeting: '你好',
      locale:   { 'en-us': 'English', 'zh-hans': '简体中文' },
      onlyInZh: 'Only in Chinese',
    },
  };
}

function makeState(overrides?: Partial<ReturnType<typeof state>>): ReturnType<typeof state> {
  const base = state();

  base.translations = makeTranslations() as any;
  base.selected = 'en-us';
  base.default = 'en-us';
  base.available = ['en-us', 'zh-hans'];

  return Object.assign(base, overrides);
}

// ----- helpers to build mock getters (for testing getters.withFallback / multiWithFallback) -----

function makeMockGetters(st: ReturnType<typeof state>) {
  const g: Record<string, any> = {};

  g.t = getters.t(st);
  g.exists = getters.exists(st);
  g.withFallback = getters.withFallback(st, g);
  g.multiWithFallback = getters.multiWithFallback(st, g);

  return g;
}

// =====================================================================
describe('i18n store', () => {
  // -----------------------------------------------------------------
  describe('state', () => {
    it('sets default locale to en-us', () => {
      const s = state();

      expect(s.default).toStrictEqual('en-us');
    });

    it('starts with selected as null', () => {
      const s = state();

      expect(s.selected).toBeNull();
    });

    it('includes en-us and zh-hans in available locales', () => {
      const s = state();

      expect(s.available).toContain('en-us');
      expect(s.available).toContain('zh-hans');
    });
  });

  // -----------------------------------------------------------------
  describe('getters', () => {
    describe('hasMultipleLocales', () => {
      it('returns true when more than one locale is available', () => {
        const s = makeState({ available: ['en-us', 'zh-hans'] });

        expect(getters.hasMultipleLocales(s)).toBe(true);
      });

      it('returns false when only one locale is available', () => {
        const s = makeState({ available: ['en-us'] });

        expect(getters.hasMultipleLocales(s)).toBe(false);
      });
    });

    describe('current', () => {
      it('returns the selected locale', () => {
        const s = makeState({ selected: 'zh-hans' });

        expect(getters.current(s)()).toStrictEqual('zh-hans');
      });
    });

    describe('default', () => {
      it('returns the default locale', () => {
        const s = makeState({ default: 'en-us' });

        expect(getters.default(s)()).toStrictEqual('en-us');
      });
    });

    describe('selectedLocaleLabel', () => {
      it('returns a raw placeholder when selected is NONE', () => {
        const s = makeState({ selected: NONE });

        expect(getters.selectedLocaleLabel(s)).toStrictEqual('%locale.none%');
      });

      it('returns the locale label from the default translations', () => {
        const s = makeState({ selected: 'zh-hans' });

        expect(getters.selectedLocaleLabel(s)).toStrictEqual('Chinese Simplified');
      });
    });

    describe('availableLocales', () => {
      it('returns raw placeholder labels when selected is NONE', () => {
        const s = makeState({ selected: NONE });
        const result = getters.availableLocales(s, getters);

        expect(result).toStrictEqual({
          'en-us':   '%locale.en-us%',
          'zh-hans': '%locale.zh-hans%',
        });
      });

      it('returns translated labels from the default translations', () => {
        const s = makeState({ selected: 'en-us' });
        const result = getters.availableLocales(s, getters);

        expect(result).toStrictEqual({
          'en-us':   'English',
          'zh-hans': 'Chinese Simplified',
        });
      });
    });

    describe('t', () => {
      it('returns a %key% placeholder when selected is NONE and no language override', () => {
        const s = makeState({ selected: NONE });
        const translate = getters.t(s);

        expect(translate('t.noneKey')).toStrictEqual('%t.noneKey%');
      });

      it('returns the translated string for a key in the selected locale', () => {
        const s = makeState({ selected: 'en-us' });
        const translate = getters.t(s);

        expect(translate('greeting')).toStrictEqual('Hello');
      });

      it('falls back to the default locale when the key is missing in the selected locale', () => {
        const s = makeState({ selected: 'zh-hans' });
        const translate = getters.t(s);

        // 'farewell' exists only in en-us (the default)
        expect(translate('farewell')).toStrictEqual('Goodbye');
      });

      it('returns the locale-specific translation when key exists in the selected locale', () => {
        const s = makeState({ selected: 'zh-hans' });
        const translate = getters.t(s);

        expect(translate('greeting')).toStrictEqual('你好');
      });

      it('formats a message with IntlMessageFormat when the message contains {', () => {
        const s = makeState({ selected: 'en-us' });
        const translate = getters.t(s);

        expect(translate('template.message', { count: 3 })).toStrictEqual('Found 3 items');
      });

      it('returns undefined when the key is not found in any locale', () => {
        const s = makeState({ selected: 'en-us' });
        const translate = getters.t(s);

        expect(translate('t.keyThatDoesNotExist99')).toBeUndefined();
      });

      it('returns undefined when the translation value is an object', () => {
        // 'object-msg' is an object { key1: 'val1', key2: 'val2' } in en-us
        const s = makeState({ selected: 'en-us' });
        const translate = getters.t(s);

        expect(translate('object-msg')).toBeUndefined();
      });

      it('uses the language override even when selected is NONE', () => {
        const s = makeState({ selected: NONE });
        const translate = getters.t(s);

        expect(translate('greeting', {}, 'en-us')).toStrictEqual('Hello');
      });
    });

    describe('exists', () => {
      it('returns true when the key exists in the default translations', () => {
        const s = makeState({ selected: 'en-us' });
        const check = getters.exists(s);

        expect(check('farewell')).toBe(true);
      });

      it('returns true when the key exists only in the selected locale translations', () => {
        const s = makeState({ selected: 'zh-hans' });
        const check = getters.exists(s);

        // 'onlyInZh' is only in zh-hans
        expect(check('onlyInZh')).toBe(true);
      });

      it('returns false when the key does not exist in any locale', () => {
        const s = makeState({ selected: 'en-us' });
        const check = getters.exists(s);

        expect(check('exists.keyThatIsDefinitelyMissing99')).toBe(false);
      });

      it('only checks default translations when locale is NONE', () => {
        const s = makeState({ selected: NONE });
        const check = getters.exists(s);

        // 'onlyInZh' is not in the default (en-us) translations
        expect(check('onlyInZh')).toBe(false);
      });

      it('returns true for a key in the default translations regardless of selected locale', () => {
        const s = makeState({ selected: 'zh-hans' });
        const check = getters.exists(s);

        expect(check('farewell')).toBe(true);
      });
    });

    describe('withFallback', () => {
      it('returns the translated value when the key exists', () => {
        const s = makeState({ selected: 'en-us' });
        const g = makeMockGetters(s);

        expect(g.withFallback('greeting', {}, 'fallback-text')).toStrictEqual('Hello');
      });

      it('returns the fallback string when the key does not exist', () => {
        const s = makeState({ selected: 'en-us' });
        const g = makeMockGetters(s);

        expect(g.withFallback('withfallback.missingKey1', {}, 'fallback-text')).toStrictEqual('fallback-text');
      });

      it('supports the two-argument form withFallback(key, fallback) when args is a string', () => {
        const s = makeState({ selected: 'en-us' });
        const g = makeMockGetters(s);

        // Two-arg form: withFallback('missingKey', 'fallback') — args is the fallback
        expect(g.withFallback('withfallback.missingKey2', 'string-fallback')).toStrictEqual('string-fallback');
      });

      it('returns the translated fallback key when fallbackIsKey is true', () => {
        const s = makeState({ selected: 'en-us' });
        const g = makeMockGetters(s);

        // key 'withfallback.missingKey3' doesn't exist; fallbackKey 'farewell' does
        expect(g.withFallback('withfallback.missingKey3', {}, 'farewell', true)).toStrictEqual('Goodbye');
      });

      it('returns the translated value and does not use fallback when key exists', () => {
        const s = makeState({ selected: 'en-us' });
        const g = makeMockGetters(s);

        expect(g.withFallback('farewell', {}, 'should-not-appear')).toStrictEqual('Goodbye');
      });
    });

    describe('multiWithFallback', () => {
      it('translates each item\'s key field using withFallback', () => {
        const s = makeState({ selected: 'en-us' });
        const g = makeMockGetters(s);
        const items = [{ key: 'greeting' }, { key: 'farewell' }];

        const result = g.multiWithFallback(items);

        expect(result[0].key).toStrictEqual('Hello');
        expect(result[1].key).toStrictEqual('Goodbye');
      });

      it('uses the raw value as fallback when the i18n key is missing', () => {
        const s = makeState({ selected: 'en-us' });
        const g = makeMockGetters(s);
        const items = [{ key: 'multifallback.rawKey' }];

        const result = g.multiWithFallback(items);

        expect(result[0].key).toStrictEqual('multifallback.rawKey');
      });
    });
  });

  // -----------------------------------------------------------------
  describe('mutations', () => {
    describe('loadTranslations', () => {
      it('sets translations for the given locale', () => {
        const s = makeState();
        const newTranslations = { hello: 'Bonjour' };

        mutations.loadTranslations(s, { locale: 'fr', translations: newTranslations });

        expect((s.translations as any).fr).toStrictEqual(newTranslations);
      });

      it('overwrites existing translations for the locale', () => {
        const s = makeState();
        const updated = { greeting: 'Hi there' };

        mutations.loadTranslations(s, { locale: 'en-us', translations: updated });

        expect((s.translations as any)['en-us']).toStrictEqual(updated);
      });
    });

    describe('mergeLoadTranslations', () => {
      it('sets translations when the locale has no existing entry', () => {
        const s = makeState();
        const initial = { bonjour: 'Hello' };

        mutations.mergeLoadTranslations(s, { locale: 'fr-new', translations: initial });

        expect((s.translations as any)['fr-new']).toStrictEqual(initial);
      });

      it('merges new translations into existing ones without overwriting unrelated keys', () => {
        const s = makeState();

        mutations.mergeLoadTranslations(s, {
          locale:       'en-us',
          translations: { extra: 'Extra Value' },
        });

        expect((s.translations as any)['en-us'].greeting).toStrictEqual('Hello');
        expect((s.translations as any)['en-us'].extra).toStrictEqual('Extra Value');
      });
    });

    describe('setSelected', () => {
      it('sets state.selected to the given locale', () => {
        const s = makeState({ selected: 'en-us' });

        mutations.setSelected(s, 'zh-hans');

        expect(s.selected).toStrictEqual('zh-hans');
      });

      it('removes the lang attribute from <html> when locale is NONE', () => {
        const s = makeState({ selected: 'en-us' });
        const html = document.querySelector('html')!;

        html.setAttribute('lang', 'en-us');
        mutations.setSelected(s, NONE);

        expect(html.getAttribute('lang')).toBeNull();
      });

      it('sets the lang attribute on <html> to the given locale', () => {
        const s = makeState();

        mutations.setSelected(s, 'zh-hans');

        expect(document.querySelector('html')!.getAttribute('lang')).toStrictEqual('zh-hans');
      });
    });

    describe('addLocale', () => {
      it('adds a new locale to the available list', () => {
        const s = makeState({ available: ['en-us'] });

        mutations.addLocale(s, { locale: 'fr', label: 'French' });

        expect(s.available).toContain('fr');
      });

      it('does not add a locale that already exists', () => {
        const s = makeState({ available: ['en-us', 'zh-hans'] });

        mutations.addLocale(s, { locale: 'en-us', label: 'English' });

        expect(s.available.filter((l) => l === 'en-us')).toHaveLength(1);
      });

      it('registers the locale label in the default translations', () => {
        const s = makeState();

        mutations.addLocale(s, { locale: 'de', label: 'German' });

        expect((s.translations as any)['en-us'].locale.de).toStrictEqual('German');
      });
    });

    describe('removeLocale', () => {
      it('removes an existing locale from the available list', () => {
        const s = makeState({ available: ['en-us', 'zh-hans'] });

        mutations.removeLocale(s, 'zh-hans');

        expect(s.available).not.toContain('zh-hans');
      });

      it('is a no-op when the locale does not exist in the available list', () => {
        const s = makeState({ available: ['en-us', 'zh-hans'] });

        mutations.removeLocale(s, 'fr');

        expect(s.available).toHaveLength(2);
      });

      it('deletes the translations for the removed locale', () => {
        const s = makeState();

        mutations.removeLocale(s, 'zh-hans');

        expect((s.translations as any)['zh-hans']).toBeUndefined();
      });
    });
  });

  // -----------------------------------------------------------------
  describe('actions', () => {
    describe('addLocale', () => {
      it('commits addLocale with the locale and label', () => {
        const commit = jest.fn();

        actions.addLocale({ commit } as any, { locale: 'de', label: 'German' });

        expect(commit).toHaveBeenCalledWith('addLocale', { locale: 'de', label: 'German' });
      });
    });

    describe('removeLocale', () => {
      it('commits removeLocale with the locale', () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const g = { current: () => 'en-us' };

        actions.removeLocale(
          {
            commit, dispatch, getters: g
          } as any,
          { locale: 'zh-hans' }
        );

        expect(commit).toHaveBeenCalledWith('removeLocale', 'zh-hans');
      });

      it('dispatches switchTo the default locale when the removed locale is the current one', () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const g = { current: () => 'zh-hans' };

        actions.removeLocale(
          {
            commit, dispatch, getters: g
          } as any,
          { locale: 'zh-hans' }
        );

        expect(dispatch).toHaveBeenCalledWith('switchTo', 'en-us');
      });

      it('does not dispatch switchTo when the removed locale is not the current one', () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const g = { current: () => 'en-us' };

        actions.removeLocale(
          {
            commit, dispatch, getters: g
          } as any,
          { locale: 'zh-hans' }
        );

        expect(dispatch).not.toHaveBeenCalled();
      });
    });

    describe('toggleNone', () => {
      it('dispatches switchTo NONE when the current locale is not NONE', () => {
        const dispatch = jest.fn();
        const s = makeState({ selected: 'en-us' });

        actions.toggleNone({ state: s, dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('switchTo', NONE);
      });

      it('dispatches switchTo the previous locale when the current locale is NONE and previous is set', () => {
        const dispatch = jest.fn();
        const s = makeState({ selected: NONE, previous: 'zh-hans' });

        actions.toggleNone({ state: s, dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('switchTo', 'zh-hans');
      });

      it('dispatches switchTo the default locale when the current locale is NONE and no previous is set', () => {
        const dispatch = jest.fn();
        const s = makeState({
          selected: NONE,
          previous: null,
          default:  'en-us',
        });

        actions.toggleNone({ state: s, dispatch } as any);

        expect(dispatch).toHaveBeenCalledWith('switchTo', 'en-us');
      });
    });
  });
});
