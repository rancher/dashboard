import { mount } from '@vue/test-utils';
import Networking from '@shell/components/form/Networking.vue';
import { nextTick } from 'vue';

jest.mock('lodash/debounce', () => jest.fn((fn) => fn));

describe('component: Networking', () => {
  it.each([
    {
      ip:        '10.1.1.1',
      hostnames: ['host1']
    },
    {
      ip:        '10.1.1.2',
      hostnames: ['host1', 'host2']
    },
    {
      ip:        '10.1.1.3',
      hostnames: []
    }
  ])('should render host aliases form if the value contains host aliases config: [%j]', (hostAliasesConfig) => {
    const wrapper = mount(Networking, {
      props: {
        value: { hostAliases: [hostAliasesConfig] },
        mode:  'create',
      },
      global: { mocks: { $store: { getters: { 'i18n/t': jest.fn() } } } }
    });

    const hostAliases = wrapper.findComponent('[data-test="hostAliases"]');
    const keyInput = hostAliases.find('[data-testid="input-kv-item-key-0"]');
    const valueInput = hostAliases.find('[data-testid="kv-item-value-0"]');

    expect(keyInput.element.value).toBe(hostAliasesConfig.ip);
    expect(valueInput.find('[data-testid="value-multiline"]').element.value).toBe(hostAliasesConfig.hostnames.join(', '));
  });

  it('should render host aliases form correctly if click add host aliases button', async() => {
    const wrapper = mount(Networking, {
      props: {
        value:            {},
        'onUpdate:value': (e) => wrapper.setProps({ value: e }),
        mode:             'create',
      },
      global: { mocks: { $store: { getters: { 'i18n/t': jest.fn() } } } }
    });

    const hostAliases = wrapper.findComponent('[data-test="hostAliases"]');
    const addButton = hostAliases.find('[data-testid="add_link_button"]');
    let keyInput = hostAliases.find('[data-testid="input-kv-item-key-0"]');
    let valueInput = hostAliases.find('[data-testid="kv-item-value-0"]');

    expect(keyInput.exists()).toBe(false);
    expect(valueInput.exists()).toBe(false);
    expect(wrapper.props('value')).toStrictEqual({});
    addButton.trigger('click');
    await nextTick();

    keyInput = hostAliases.find('[data-testid="input-kv-item-key-0"]');
    valueInput = hostAliases.find('[data-testid="kv-item-value-0"]');

    expect(keyInput.exists()).toBe(true);
    expect(valueInput.exists()).toBe(true);
    await nextTick();

    const v = wrapper.props('value');

    expect(v.hostAliases).toHaveLength(1);
    expect(v.hostAliases[0].ip).toBe('');
    expect(v.hostAliases[0].hostnames).toStrictEqual([]);

    keyInput = hostAliases.find('[data-testid="input-kv-item-key-0"]');
    valueInput = hostAliases.find('[data-testid="kv-item-value-0"]');

    expect(keyInput.exists()).toBe(true);
    expect(valueInput.exists()).toBe(true);
  });

  it('should render host aliases form correctly if modify the form values', async() => {
    const wrapper = mount(Networking, {
      props: {
        value:            {},
        'onUpdate:value': (e) => wrapper.setProps({ value: e }),
        mode:             'create',
      },
      global: { mocks: { $store: { getters: { 'i18n/t': jest.fn() } } } }
    });

    const hostAliases = wrapper.findComponent('[data-test="hostAliases"]');
    const addButton = hostAliases.find('[data-testid="add_link_button"]');

    addButton.trigger('click');
    await nextTick();
    let v = wrapper.props('value');

    expect(v.hostAliases).toHaveLength(1);
    expect(v.hostAliases[0].ip).toBe('');
    expect(v.hostAliases[0].hostnames).toStrictEqual([]);

    let keyInput = hostAliases.find('[data-testid="input-kv-item-key-0"]');
    let valueInput = hostAliases.find('[data-testid="kv-item-value-0"]');

    expect(keyInput.exists()).toBe(true);
    expect(valueInput.exists()).toBe(true);

    keyInput.setValue('10.1.1.1');
    valueInput.find('[data-testid="value-multiline"]').setValue('test1, test2');
    await nextTick();
    v = wrapper.props('value');

    expect(v.hostAliases).toHaveLength(1);
    expect(v.hostAliases[0].ip).toBe('10.1.1.1');
    expect(v.hostAliases[0].hostnames).toStrictEqual(['test1', 'test2']);

    keyInput = hostAliases.find('[data-testid="input-kv-item-key-0"]');
    valueInput = hostAliases.find('[data-testid="kv-item-value-0"]');
    expect(keyInput.exists()).toBe(true);
    expect(valueInput.exists()).toBe(true);
  });
});
