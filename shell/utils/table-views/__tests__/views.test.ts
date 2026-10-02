import { SAVED_VIEWS_VERSION, savedViewsByType, savedViewsPref } from '@shell/utils/table-views/views';

describe('the saved views preference', () => {
  const byType = { pod: { views: [{ id: 'a', name: 'a' }] } };

  it('should be written with the version of its shape', () => {
    expect(savedViewsPref(byType)).toStrictEqual({ metadata: { version: SAVED_VIEWS_VERSION }, payload: byType });
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
