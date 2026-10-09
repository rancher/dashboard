import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createStore } from 'vuex';

import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput.vue';
import type { TableViewField } from '@shell/types/table-views';

const STATE: TableViewField = {
  id: 'state', label: 'State', isLabel: false
};

/** Values the api would give, which the list should wait for rather than show the page's first */
const ACTIVE = [{ value: 'active', count: 3 }];

describe('TableViewQueryInput', () => {
  let wrapper: VueWrapper;

  const menu = () => document.body.querySelector('[data-testid="table-views-suggestions"]');
  const options = () => Array.from(document.body.querySelectorAll('[data-testid="table-views-suggestions"] [role="option"]'));
  const loadingRow = () => document.body.querySelector('[data-testid="table-views-suggestions-loading"]');

  /** Typed into the box, as the list follows what was typed, then given back as the box's value */
  const type = async(text: string) => {
    const box = wrapper.find('[data-testid="table-views-query"]');

    await box.trigger('focus');
    box.element.textContent = text;
    await box.trigger('input');
    await wrapper.setProps({ value: text });
    await nextTick();
  };

  const mountWith = (props: Record<string, unknown>) => {
    const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

    wrapper = mount(TableViewQueryInput, {
      props:    { fields: [STATE], ...props },
      global:   { plugins: [store] },
      attachTo: document.body,
    });
  };

  afterEach(() => wrapper?.unmount());

  it('should say it is loading a field\'s values, offering none, until they come', async() => {
    mountWith({ loadingValues: ['state'], rows: [{ metadata: { name: 'x' }, state: 'from-the-page' }] });
    await type('state:');

    expect(menu()?.getAttribute('aria-busy')).toBe('true');
    expect(loadingRow()).not.toBeNull();
    expect(options()).toHaveLength(0);

    await wrapper.setProps({ loadingValues: [], fieldValues: { state: ACTIVE } });

    expect(menu()?.getAttribute('aria-busy')).toBe('false');
    expect(loadingRow()).toBeNull();
    expect(options().map((option) => option.textContent)).toStrictEqual([expect.stringContaining('active')]);
  });

  it('should not say it is loading values for a field whose values it doesn\'t offer', async() => {
    const NAME: TableViewField = {
      id: 'name', label: 'Name', isLabel: false
    };

    // `name` can be queried, but its values are not among those offered
    mountWith({
      fields: [STATE, NAME], filterFields: [STATE], loadingValues: ['name']
    });
    await type('name:');

    expect(loadingRow()).toBeNull();
    expect(menu()?.getAttribute('aria-busy')).not.toBe('true');
  });

  it('should pick nothing on Enter while the values load', async() => {
    mountWith({ loadingValues: ['state'] });
    await type('state:');

    const typed = wrapper.emitted('update:value')?.length;

    await wrapper.find('[data-testid="table-views-query"]').trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:value')).toHaveLength(typed as number);
  });

  it('should name a field by its column first, and the word to type second', async() => {
    mountWith({});
    await type('sta');

    const field = options().find((option) => option.textContent?.includes('State'));

    expect(field?.querySelector('.suggestion-label')?.textContent?.trim()).toBe('State');
    expect(field?.querySelector('.suggestion-detail')?.textContent?.trim()).toBe('state');
  });

  describe('asking for a field\'s values again', () => {
    const refreshed = () => (wrapper.emitted('refresh-values') || []).map(([id]) => id);

    it('should ask as the field\'s values open, not as more of the value is typed', async() => {
      mountWith({ fieldValues: { state: ACTIVE } });

      await type('state:');
      await type('state:ac');
      await type('state:act');

      expect(refreshed()).toStrictEqual(['state']);
    });

    it('should ask again when they open again, once the box was left', async() => {
      mountWith({ fieldValues: { state: ACTIVE } });

      await type('state:');
      // Left for real: the box waits a moment, so a click on a suggestion lands first
      await wrapper.find('[data-testid="table-views-query"]').trigger('blur');
      await new Promise((resolve) => setTimeout(resolve, 200));
      await type('state:');

      expect(refreshed()).toStrictEqual(['state', 'state']);
    });

    it('should not ask for a field whose values it doesn\'t offer', async() => {
      mountWith({ filterFields: [], fieldValues: { state: ACTIVE } });

      await type('state:');

      expect(refreshed()).toStrictEqual([]);
    });
  });
});
