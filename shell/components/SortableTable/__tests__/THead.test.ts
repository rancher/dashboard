import fs from 'fs';
import path from 'path';
import jsyaml from 'js-yaml';
import { shallowMount } from '@vue/test-utils';
import THead from '@shell/components/SortableTable/THead.vue';
import { NONE } from '@shell/components/SortableTable/selection';

const NAME_COLUMN = {
  name:     'name',
  labelKey: 'tableHeaders.name',
  sort:     ['nameSort'],
};

// The Explore column used to ship `label: ' '` as its accessible name. It has a real
// one now, kept out of sight so the list looks the way it always has.
const EXPLORE_COLUMN = {
  name:                'explore',
  labelKey:            'tableHeaders.explore',
  labelVisuallyHidden: true,
};

const defaultProps = (overrides = {}) => ({
  columns:         [NAME_COLUMN],
  sortBy:          'name',
  tableActions:    false,
  rowActions:      false,
  rowActionsWidth: 40,
  howMuchSelected: NONE,
  // mirrors labelFor() in SortableTable/index.vue, which prefers labelKey over label
  labelFor:        (col: any) => (col.labelKey ? `%${ col.labelKey }%` : col.label || col.name),
  ...overrides,
});

const mountTHead = (overrides = {}) => shallowMount(THead, { props: defaultProps(overrides) });

describe('component: THead', () => {
  it.each([
    ['sub row expand', { subExpandColumn: true }, '%sortableTable.expandColumnHeader%'],
    ['row actions', { rowActions: true }, '%sortableTable.actionsColumnHeader%'],
    ['row actions with advanced filtering', {
      rowActions: true, hasAdvancedFiltering: true, tableColsOptions: [{ label: 'Name', isTableOption: true }]
    }, '%sortableTable.actionsColumnHeader%'],
  ])('should give the %p column header a visually hidden name', (_label, props, expected) => {
    const wrapper = mountTHead(props);
    const srOnly = wrapper.findAll('th .sr-only');

    expect(srOnly).toHaveLength(1);
    expect(srOnly[0].text()).toStrictEqual(expected);
  });

  it.each([
    ['sub row expand', { subExpandColumn: true }],
    ['row actions', { rowActions: true }],
    ['row actions with advanced filtering', {
      rowActions: true, hasAdvancedFiltering: true, tableColsOptions: [{ label: 'Name', isTableOption: true }]
    }],
  ])('should keep the visually hidden name of %p inside a positioned element', (_label, props) => {
    // `.content` is what the scoped style makes the containing block, so the absolutely
    // positioned name cannot escape the list's horizontal scroller
    const wrapper = mountTHead(props);

    expect(wrapper.find('th .content > .sr-only').exists()).toBe(true);
  });

  it('should not make the cell holding the column options menu a containing block', () => {
    const wrapper = mountTHead({
      rowActions: true, hasAdvancedFiltering: true, tableColsOptions: [{ label: 'Name', isTableOption: true }]
    });
    const cells = wrapper.findAll('th');
    const optionsCell = cells.find((th) => th.find('.table-options-group').exists());

    expect(optionsCell?.find('.content > .sr-only').exists()).toBe(true);
    expect(cells.filter((th) => th.classes('content'))).toHaveLength(0);
  });

  it.each([
    ['without advanced filtering', {}, false],
    // the row where the cell used to come from a different branch
    ['with advanced filtering but no toggleable columns', { hasAdvancedFiltering: true }, false],
    ['with advanced filtering', { hasAdvancedFiltering: true, tableColsOptions: [{ label: 'Name', isTableOption: true }] }, true],
  ])('should render one row actions header cell %p', (_label, props, hasOptions) => {
    const cells = mountTHead({ rowActions: true, ...props }).findAll('th');

    expect(cells).toHaveLength(2);
    expect(cells[1].find('.sr-only').text()).toStrictEqual('%sortableTable.actionsColumnHeader%');
    expect(cells[1].find('.table-options-group').exists()).toStrictEqual(hasOptions);
  });

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('should hide the header of a column declaring labelVisuallyHidden %p', (labelVisuallyHidden, hidden) => {
    const span = mountTHead({ columns: [{ ...NAME_COLUMN, labelVisuallyHidden }] }).find('th .content > span');

    // the name a screen reader gets is the same either way, it is only kept out of sight
    expect(span.text()).toStrictEqual('%tableHeaders.name%');
    expect(span.classes('sr-only')).toStrictEqual(hidden);
  });

  it('should keep a hidden column name inside a positioned element', () => {
    const wrapper = mountTHead({ columns: [EXPLORE_COLUMN] });

    expect(wrapper.find('th .content > .sr-only').exists()).toBe(true);
  });

  it('should leave no header cell without text a screen reader can read', () => {
    const wrapper = mountTHead({
      subExpandColumn: true,
      rowActions:      true,
      columns:         [NAME_COLUMN, EXPLORE_COLUMN],
    });

    expect(wrapper.findAll('th').map((th) => th.text())).toStrictEqual([
      '%sortableTable.expandColumnHeader%',
      '%tableHeaders.name%',
      '%tableHeaders.explore%',
      '%sortableTable.actionsColumnHeader%',
    ]);
  });
});

describe('translations for the named table headers', () => {
  // The `t` mock returns `%key%` for any key, so the assertions above pass whether or not the key
  // exists. Read the shipped translations to check these ones resolve to a real string.
  const load = (file: string) => jsyaml.load(fs.readFileSync(path.resolve(__dirname, file), 'utf8')) as Record<string, any>;

  const shell = load('../../../assets/translations/en-us.yaml');
  const harvesterManager = load('../../../../pkg/harvester-manager/l10n/en-us.yaml');

  it.each([
    ['sortableTable.expandColumnHeader', shell.sortableTable.expandColumnHeader],
    ['sortableTable.actionsColumnHeader', shell.sortableTable.actionsColumnHeader],
    ['tableHeaders.explore', shell.tableHeaders.explore],
    // names the harvester-manager column, which lives outside the file above
    ['harvesterManager.manage', harvesterManager.harvesterManager.manage],
  ])('should have a value for %p', (_key, value) => {
    expect(typeof value).toStrictEqual('string');
    expect(value.trim().length).toBeGreaterThan(0);
  });
});
