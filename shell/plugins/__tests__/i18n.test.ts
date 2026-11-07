import { stringFor } from '@shell/plugins/i18n';
import { Store } from 'vuex';

describe('stringFor', () => {
  const makeStore = (translate: jest.Mock): Store<any> => ({ getters: { 'i18n/t': translate } } as unknown as Store<any>);

  it('returns the raw translation when one is found', () => {
    const translate = jest.fn(() => 'Hello world');
    const store = makeStore(translate);

    const result = stringFor(store, 'greeting.hello');

    expect(translate).toHaveBeenCalledWith('greeting.hello', undefined);
    expect(result).toBe('Hello world');
  });

  it('escapes html in a found translation by default', () => {
    const translate = jest.fn(() => '<b>bold</b>');
    const store = makeStore(translate);

    const result = stringFor(store, 'some.key');

    expect(result).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('does not escape html when raw is true', () => {
    const translate = jest.fn(() => '<b>bold</b>');
    const store = makeStore(translate);

    const result = stringFor(store, 'some.key', undefined, true);

    expect(result).toBe('<b>bold</b>');
  });

  it('does not escape html when escapehtml is false', () => {
    const translate = jest.fn(() => '<i>italic</i>');
    const store = makeStore(translate);

    const result = stringFor(store, 'some.key', undefined, false, false);

    expect(result).toBe('<i>italic</i>');
  });

  it('falls back to a bare placeholder when the key is missing and no args are given', () => {
    const translate = jest.fn(() => undefined);
    const store = makeStore(translate);

    const result = stringFor(store, 'missing.key');

    expect(result).toBe('%missing.key%');
  });

  it('falls back to a bare placeholder when args is an empty object', () => {
    const translate = jest.fn(() => undefined);
    const store = makeStore(translate);

    const result = stringFor(store, 'missing.key', {});

    expect(result).toBe('%missing.key%');
  });

  it('falls back to an argument-interpolated placeholder when the key is missing and args are present', () => {
    const translate = jest.fn(() => undefined);
    const store = makeStore(translate);

    const result = stringFor(store, 'missing.key', { count: 3, name: 'foo' });

    expect(result).toBe('%missing.key(count: 3, name: foo)%');
  });

  it('does not escape the argument-interpolated placeholder even though escapehtml defaults to true', () => {
    const translate = jest.fn(() => undefined);
    const store = makeStore(translate);

    const result = stringFor(store, 'missing.key', { html: '<b>x</b>' });

    expect(result).toBe('%missing.key(html: <b>x</b>)%');
  });

  it.each([
    {
      desc:        'empty string translation',
      translation: '',
      expected:    '',
    },
    {
      desc:        'numeric zero translation',
      translation: 0,
      expected:    '0',
    },
  ])('treats a falsy-but-defined translation as found (not missing) for $desc', ({ translation, expected }) => {
    const translate = jest.fn(() => translation);
    const store = makeStore(translate);

    const result = stringFor(store, 'some.key');

    expect(result).toBe(expected);
  });
});
