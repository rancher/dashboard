import AuthConfigDetail from '@shell/pages/c/_cluster/auth/config/_id.vue';
import { shallowMount } from '@vue/test-utils';
import ResourceDetail from '@shell/components/ResourceDetail';
import { MANAGEMENT } from '@shell/config/types';

describe('page: AuthConfigDetail', () => {
  it.each([
    ['github', 'githubConfig', 'github'],
    ['github-2', 'githubConfig', 'github'],
    ['corporate-login', 'azureADConfig', 'azuread'],
  ])('resolves the form for %s from its provider type', async(id, type, provider) => {
    const dispatch = jest.fn().mockResolvedValue({ _type: type });
    const fetchState = { pending: true };
    const wrapper = shallowMount(AuthConfigDetail, {
      global: {
        mocks: {
          $store: { dispatch }, $route: { params: { id } }, $fetchState: fetchState
        }
      }
    });

    expect(wrapper.findComponent(ResourceDetail).exists()).toBe(false);
    await (wrapper.vm.$options as any).fetch.call(wrapper.vm);
    fetchState.pending = false;
    wrapper.vm.$forceUpdate();
    await wrapper.vm.$nextTick();

    expect(dispatch).toHaveBeenCalledWith('management/find', { type: MANAGEMENT.AUTH_CONFIG, id });
    expect(wrapper.findComponent(ResourceDetail).props('subTypeOverride')).toBe(provider);
  });

  // The page used to refuse to leave for the auth product's root, which was there
  // to break a redirect loop with a list page that no longer redirects. All it
  // does now is strand the user on the provider when they go back.
  it('should let the user navigate away to the provider list', () => {
    expect((AuthConfigDetail as any).beforeRouteLeave).toBeUndefined();
  });
});
