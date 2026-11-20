import { flushPromises, mount } from '@vue/test-utils';
import TableViewControls from '@shell/components/TableViews/TableViewControls.vue';
import DragGrip from '@shell/components/DragGrip.vue';
import type { TableViewField } from '@shell/types/table-views';

// The menu's parts render their slots in place, so the columns are on the page without opening it
const slots = '<slot name="before" /><slot /><slot name="after" /><slot name="dropdownCollection" /><slot name="submenu" />';
const Slots = { inheritAttrs: false, template: `<div v-bind="$attrs">${ slots }</div>` };

const fields: TableViewField[] = [
  {
    id: 'state', label: 'State', isLabel: false
  },
  {
    id: 'name', label: 'Name', isLabel: false
  },
  {
    id: 'age', label: 'Age', isLabel: false
  },
  {
    id: 'image', label: 'Image', isLabel: false
  },
];

const view = {
  name: 'all', query: '', columns: null, labelColumns: [], columnOrder: null, groupBy: null, sort: null, sortDescending: false
};

function load({ coreColumns = ['state'] } = {}) {
  return mount(TableViewControls, {
    attachTo: document.body,
    props:    {
      view, fields, coreColumns
    },
    global: {
      stubs: {
        TableViewQueryInput:    true,
        RcDropdown:             Slots,
        RcDropdownTrigger:      Slots,
        RcDropdownSubmenu:      Slots,
        RcDropdownItem:         Slots,
        RcDropdownItemRadio:    Slots,
        RcDropdownItemCheckbox: Slots,
        RcDropdownSeparator:    true,
      },
      directives: { cleanTooltip: {} },
    },
  });
}

type Wrapper = ReturnType<typeof load>;

const column = (wrapper: Wrapper, id: string) => wrapper.find(`[data-col-id="${ id }"]`);
const lastView = (wrapper: Wrapper) => wrapper.emitted('update:view')?.at(-1);
const withOrder = (columnOrder: string[]) => [expect.objectContaining({ columnOrder })];

describe('component: TableViewControls columns', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should give each movable column a drag grip, and a locked column a lock', () => {
    const wrapper = load();

    expect(column(wrapper, 'name').findComponent(DragGrip).exists()).toBe(true);
    expect(column(wrapper, 'state').findComponent(DragGrip).exists()).toBe(false);
    expect(column(wrapper, 'state').find('.icon-lock').exists()).toBe(true);
  });

  it('should save the order a drag leaves', async() => {
    const wrapper = load();

    await wrapper.find('[data-testid="table-views-col-handle-name"]').trigger('mousedown', { button: 0, clientY: 0 });
    // jsdom lays nothing out, so every row measures 0 high: anywhere below the list is past its end
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 50 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    await flushPromises();

    expect(lastView(wrapper)).toStrictEqual(withOrder(['state', 'age', 'image', 'name']));
  });

  it('should move a column with Alt+Down and Alt+Up and say where it went', async() => {
    const wrapper = load();

    await column(wrapper, 'name').trigger('keydown', { key: 'ArrowDown', altKey: true });

    expect(lastView(wrapper)).toStrictEqual(withOrder(['state', 'age', 'name', 'image']));
    await flushPromises();
    expect(wrapper.find('[role="status"]').text()).toBe('tableViews.columns.moved-{"label":"Name","position":3,"total":4}');

    await column(wrapper, 'age').trigger('keydown', { key: 'ArrowUp', altKey: true });

    expect(lastView(wrapper)).toStrictEqual(withOrder(['state', 'age', 'name', 'image']));
  });

  it('should not move a locked column, a column above a locked one, or past the end', async() => {
    const wrapper = load();

    await column(wrapper, 'state').trigger('keydown', { key: 'ArrowDown', altKey: true });
    await column(wrapper, 'name').trigger('keydown', { key: 'ArrowUp', altKey: true });
    await column(wrapper, 'image').trigger('keydown', { key: 'ArrowDown', altKey: true });

    expect(wrapper.emitted('update:view')).toBeUndefined();
  });

  it('should not drag a column above a locked one', async() => {
    const wrapper = load();

    await wrapper.find('[data-testid="table-views-col-handle-image"]').trigger('mousedown', { button: 0, clientY: 100 });
    // Every row measures 0 high at 0: above the list is before its first row
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: -50 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    await flushPromises();

    expect(lastView(wrapper)).toStrictEqual(withOrder(['state', 'image', 'name', 'age']));
  });
});
