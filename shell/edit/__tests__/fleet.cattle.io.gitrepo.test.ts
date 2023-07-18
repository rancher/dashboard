import { mount, createLocalVue } from '@vue/test-utils';
import GitRepo from '@shell/edit/fleet.cattle.io.gitrepo.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('view: fleet.cattle.io.gitrepo should', () => {
  const mockStore = {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      workspace:                 jest.fn(),
    }
  };
  const mocks = {
    $store:      mockStore,
    $fetchState: { pending: false },
    $route:      {
      query: { AS: '' },
      name:  {
        endsWith: () => {
          return false;
        }
      }
    }
  };
  const values = {
    metadata: { namespace: 'test' }, spec: { template: {}, correctDrift: { enabled: false } }, targetInfo: { mode: 'all' },
  };
  const wrapper = mount(GitRepo, {
    localVue,
    propsData: { value: values },
    mocks
  });

  it('should have self-healing checkbox and banner', () => {
    const correctDriftCheckbox = wrapper.find('[data-testid="GitRepo-correctDrift-checkbox"]');
    const correctDriftBanner = wrapper.find('[data-testid="GitRepo-correctDrift-banner"]');

    expect(correctDriftCheckbox.exists()).toBeTruthy();
    expect(correctDriftBanner.exists()).toBeTruthy();
    expect(correctDriftCheckbox.props().value).toBeFalsy();
  });

  it('should enable drift if self-healing is checked', async() => {
    const correctDriftCheckbox = wrapper.find('[data-testid="GitRepo-correctDrift-checkbox"]');
    const correctDriftContainer = wrapper.find('[data-testid="GitRepo-correctDrift-checkbox"] .checkbox-container');

    expect(correctDriftContainer.exists()).toBeTruthy();

    await correctDriftContainer.trigger('click');

    expect(correctDriftCheckbox.emitted('input')).toHaveLength(1);
    expect(correctDriftCheckbox.emitted('input')![0][0]).toBe(true);
    expect(correctDriftCheckbox.props().value).toBeTruthy();
  });
});
