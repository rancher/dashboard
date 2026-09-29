import { isExtensionTable, isImprovedTablesEnabled, TABLE_VIEWS_SHELL } from '@shell/utils/table-views/feature';
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

  it('should be off in a Rancher that doesn\'t know the flag, whose store throws for it', () => {
    const unknown = jest.fn((name: string) => {
      throw new Error(`Unknown feature: ${ name }`);
    });

    expect(isImprovedTablesEnabled({ getters: { 'features/get': unknown } })).toBe(false);
  });

  it('should ask the root getters of a store action\'s context', () => {
    const root = flag(false);
    const local = flag(true);

    expect(isImprovedTablesEnabled({ getters: { 'features/get': local }, rootGetters: { 'features/get': root } })).toBe(false);
    expect(local).not.toHaveBeenCalled();
  });
});

describe('isExtensionTable', () => {
  const extensions = {
    getPlugins: () => ({
      'virtual-clusters':  { name: 'virtual-clusters', builtin: false },
      'harvester-manager': { name: 'harvester-manager', builtin: true },
    })
  };
  const route = (pkg?: string) => ({ name: 'c-cluster-product-resource', meta: pkg ? { product: 'x', pkg } : { product: 'x' } });

  it('should count a table built into an extension, which has its own copy of the shell', () => {
    expect(isExtensionTable({
      providedShell: {}, route: route(), extensions
    })).toBe(true);
  });

  it.each([
    ['the dashboard\'s own copy', TABLE_VIEWS_SHELL],
    ['nothing provided, eg a unit test', null],
  ])('should not count a table given %s on a dashboard page', (_, providedShell) => {
    expect(isExtensionTable({
      providedShell, route: route(), extensions
    })).toBe(false);
  });

  it('should count the dashboard\'s own table on a page an extension added', () => {
    expect(isExtensionTable({
      providedShell: TABLE_VIEWS_SHELL, route: route('virtual-clusters'), extensions
    })).toBe(true);
  });

  it('should find the extension in route metadata given as a list', () => {
    const listed = { name: 'x', meta: [{ product: 'x' }, { pkg: 'virtual-clusters' }] };

    expect(isExtensionTable({
      providedShell: TABLE_VIEWS_SHELL, route: listed, extensions
    })).toBe(true);
  });

  it.each([
    ['a built-in extension, which ships with the dashboard', 'harvester-manager'],
    ['an extension that isn\'t loaded', 'gone'],
  ])('should not count a page added by %s', (_, pkg) => {
    expect(isExtensionTable({
      providedShell: TABLE_VIEWS_SHELL, route: route(pkg), extensions
    })).toBe(false);
  });
});
