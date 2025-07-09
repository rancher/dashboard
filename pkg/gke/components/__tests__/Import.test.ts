import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';

import Import from '@pkg/gke/components/Import';

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':     (text: string) => text,
      t:            (text: string) => text,
      currentStore: () => 'current_store',
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

jest.mock('@pkg/gke/util/gcp');
jest.mock('lodash/debounce', () => jest.fn((fn) => fn));

describe('gke import', () => {
  it('should allow only the running GKE clusters to be imported', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Import, {
      propsData: {
        zone:       'test-zone',
        region:     '',
        credential: 'abc',
        projectId:  'test-project'
      },
      ...setup
    });

    await flushPromises();

    expect(wrapper.vm.clusterOptions).toHaveLength(1);
  });

  it('should use a text input if no clusters are found', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Import, {
      propsData: {
        zone:       'mocked-empty-response',
        region:     '',
        credential: 'abc',
        projectId:  'test-project'
      },
      ...setup
    });

    await flushPromises();

    const nameTextInput = wrapper.getComponent('[data-testid="gke-import-cluster-name-text"]');

    expect(nameTextInput.isVisible()).toBe(true);

    nameTextInput.vm.$emit('input', { target: { value: 'abc' } });

    await wrapper.vm.$nextTick();

    expect((wrapper.emitted('update:clusterName') || []).pop()?.[0]).toStrictEqual('abc');
  });

  it('should reset the selected cluster when a new zone is selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Import, {
      propsData: {
        zone:       'mocked-empty-response',
        region:     '',
        credential: 'abc',
        projectId:  'test-project'
      },
      ...setup
    });

    await flushPromises();

    const nameTextInput = wrapper.getComponent('[data-testid="gke-import-cluster-name-text"]');

    nameTextInput.vm.$emit('input', { target: { value: 'abc' } });
    expect((wrapper.emitted('update:clusterName') || []).pop()?.[0]).toStrictEqual('abc');

    await wrapper.vm.$nextTick();
    wrapper.setProps({ credential: 'def' });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect((wrapper.emitted('update:clusterName') || []).pop()?.[0]).toStrictEqual('');
  });
});
