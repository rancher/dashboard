import { SAVED_VIEWS_VERSION, persistenceIdOf, savedViewsByType, savedViewsPref } from '@shell/utils/table-views/views';

describe('the saved views preference', () => {
  const byType = { pod: { views: [{ id: 'a', name: 'a' }] } };

  it('should be written with the version of its shape', () => {
    expect(savedViewsPref(byType)).toStrictEqual({ metadata: { version: SAVED_VIEWS_VERSION }, payload: byType });
  });

  it('should keep the persistence id beside the version', () => {
    const pref = savedViewsPref(byType, 'k1');

    expect(pref).toStrictEqual({ metadata: { version: SAVED_VIEWS_VERSION, persistenceId: 'k1' }, payload: byType });
    expect(persistenceIdOf(pref)).toBe('k1');
    expect(savedViewsByType(pref)).toStrictEqual(byType);
  });

  it.each([undefined, null, {}, { metadata: { version: 1 } }, { metadata: { persistenceId: 3 } }])('should have no persistence id in %p', (stored) => {
    expect(persistenceIdOf(stored)).toBeNull();
  });

  it('should read what it was written as', () => {
    expect(savedViewsByType(savedViewsPref(byType))).toStrictEqual(byType);
  });

  it('should read the views saved before it had a version', () => {
    expect(savedViewsByType(byType)).toStrictEqual(byType);
  });

  it.each([undefined, null, '', 'x'])('should read nothing from %p', (stored) => {
    expect(savedViewsByType(stored)).toStrictEqual({});
  });
});
