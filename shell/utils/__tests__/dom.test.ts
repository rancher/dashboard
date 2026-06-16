import { getParent } from '@shell/utils/dom';

describe('getParent', () => {
  it('returns null when element has no parent', () => {
    const el = document.createElement('div');

    expect(getParent(el, 'div')).toBeNull();
  });

  it('returns null when el is null', () => {
    expect(getParent(null, 'div')).toBeNull();
  });

  it('returns null when el is undefined', () => {
    expect(getParent(undefined, 'div')).toBeNull();
  });

  it('returns the direct parent matching the selector', () => {
    const parent = document.createElement('section');
    const child = document.createElement('div');

    parent.appendChild(child);

    expect(getParent(child, 'section')).toBe(parent);
  });

  it('returns an ancestor matching the selector when direct parent does not match', () => {
    const grandparent = document.createElement('article');
    const parent = document.createElement('div');
    const child = document.createElement('span');

    grandparent.appendChild(parent);
    parent.appendChild(child);

    expect(getParent(child, 'article')).toBe(grandparent);
  });

  it('returns null when no ancestor matches the selector', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');

    parent.appendChild(child);

    expect(getParent(child, 'article')).toBeNull();
  });

  it('matches by class selector', () => {
    const parent = document.createElement('div');

    parent.className = 'my-container';
    const child = document.createElement('span');

    parent.appendChild(child);

    expect(getParent(child, '.my-container')).toBe(parent);
  });

  it('matches by id selector', () => {
    const parent = document.createElement('div');

    parent.id = 'root';
    const child = document.createElement('span');

    parent.appendChild(child);

    expect(getParent(child, '#root')).toBe(parent);
  });

  it('skips intermediate non-matching ancestors and finds the correct one', () => {
    const great = document.createElement('nav');
    const grandparent = document.createElement('section');
    const parent = document.createElement('div');
    const child = document.createElement('span');

    great.appendChild(grandparent);
    grandparent.appendChild(parent);
    parent.appendChild(child);

    expect(getParent(child, 'nav')).toBe(great);
  });
});
