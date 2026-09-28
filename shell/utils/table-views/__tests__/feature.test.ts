import { isImprovedTablesEnabled } from '@shell/utils/table-views/feature';
import { IMPROVED_TABLES } from '@shell/store/features';

const flag = (on: boolean) => jest.fn((name: string) => (name === IMPROVED_TABLES ? on : undefined));

describe('isImprovedTablesEnabled', () => {
  it.each([
    ['no store', undefined],
    ['a null store', null],
    ['a store with no getters', {}],
    ['a store with no features getter', { getters: {} }],
  ])('should be on when there is %s to ask', (_, store) => {
    expect(isImprovedTablesEnabled(store)).toBe(true);
  });

  it.each([true, false])('should be what the flag says (%s) when a store can answer', (on) => {
    expect(isImprovedTablesEnabled({ getters: { 'features/get': flag(on) } })).toBe(on);
  });

  it('should ask the root getters of a store action\'s context', () => {
    const root = flag(false);
    const local = flag(true);

    expect(isImprovedTablesEnabled({ getters: { 'features/get': local }, rootGetters: { 'features/get': root } })).toBe(false);
    expect(local).not.toHaveBeenCalled();
  });
});
