import { mount } from '@vue/test-utils';
import ResourceTable from '@shell/components/ResourceTable.vue';
import LimitedCell from '@shell/components/SortableTable/LimitedCell.vue';

const LONG = 'A description that goes on and on. '.repeat(40).trim();

/** A table that draws only one group's heading, which ResourceTable fills */
const tableWithGroup = (ref: string) => ({
  data:     () => ({ group: { ref, rows: [] } }),
  template: '<div><slot name="group-by" :group="group" /></div>',
});

const mountHeading = (ref: string) => mount(ResourceTable, {
  props: {
    schema: null, rows: [], headers: []
  },
  global: {
    mocks: {
      $store: {
        getters: {
          'prefs/get':           () => undefined,
          'features/get':        () => false,
          'management/byId':     () => undefined,
          'type-map/optionsFor': () => ({}),
          currentProduct:        {},
        },
        state: { $extension: { getPlugins: () => ({}) } },
      },
      $route: { meta: {}, query: {} },
      t:      (key: string) => key,
    },
    directives: {
      'clean-html': (el: HTMLElement, { value }: { value: string }) => {
        el.innerHTML = value;
      },
      'clean-tooltip': () => {},
      shortkey:        () => {},
    },
    stubs: { SortableTable: tableWithGroup(ref) },
  },
});

describe('a Group By heading', () => {
  it('should be cut to one line, still holding the whole value', () => {
    const label = mountHeading(LONG).findComponent(LimitedCell);

    expect(label.props('limits')).toStrictEqual({ lineClamp: 1 });
    expect(label.text()).toBe(LONG);
  });

  it('should be reachable from the keyboard when cut, the only place the list shows the whole value', () => {
    const label = mountHeading(LONG).findComponent(LimitedCell);

    expect(label.props('focusable')).toBe(true);
  });
});
