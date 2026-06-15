import { setWidth, getWidth } from '@shell/utils/width';

describe('setWidth', () => {
  it('does nothing when el is null', () => {
    expect(() => setWidth(null, '100px')).not.toThrow();
  });

  it('does nothing when el is undefined', () => {
    expect(() => setWidth(undefined, '100px')).not.toThrow();
  });

  it('sets style.width to a string value directly', () => {
    const el = document.createElement('div');

    setWidth(el, '200px');
    expect(el.style.width).toStrictEqual('200px');
  });

  it('sets style.width with px suffix for a numeric value', () => {
    const el = document.createElement('div');

    setWidth(el, 150);
    expect(el.style.width).toStrictEqual('150px');
  });

  it('sets style.width using the return value of a function', () => {
    const el = document.createElement('div');

    setWidth(el, () => '300px');
    expect(el.style.width).toStrictEqual('300px');
  });

  it('sets style.width using the numeric return value of a function with px suffix', () => {
    const el = document.createElement('div');

    setWidth(el, () => 50);
    expect(el.style.width).toStrictEqual('50px');
  });
});

describe('getWidth', () => {
  it('returns undefined when el is null', () => {
    expect(getWidth(null)).toBeUndefined();
  });

  it('returns undefined when el is undefined', () => {
    expect(getWidth(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty array-like object with length 0', () => {
    expect(getWidth({ length: 0 })).toBeUndefined();
  });
});
