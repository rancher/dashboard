import { mount, flushPromises } from '@vue/test-utils';
import AuthProviderAccessDrawer from '@shell/components/auth/AuthProviderAccessDrawer.vue';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals.vue';
import Loading from '@shell/components/Loading.vue';

const createModel = (overrides = {}) => ({
  id:                  'github',
  accessMode:          'restricted',
  allowedPrincipalIds: ['github_user://1'],
  save:                jest.fn(),
  ...overrides,
});

const createWrapper = ({
  resource = { id: 'github', nameDisplay: 'GitHub' } as any,
  model = createModel(),
  dispatch = undefined as undefined | jest.Mock,
} = {}) => {
  const storeDispatch = dispatch || jest.fn().mockImplementation((action: string) => {
    if (action === 'rancher/clone') {
      return Promise.resolve(model);
    }

    return Promise.resolve({ id: resource.id });
  });

  const store = {
    dispatch: storeDispatch,
    getters:  {
      'i18n/t':      (key: string) => key,
      'i18n/exists': () => true,
    },
  };

  const wrapper = mount(AuthProviderAccessDrawer, {
    props:  { resource },
    global: {
      provide: { store },
      stubs:   { AllowedPrincipals: true, Loading: true },
      mocks:   { $store: store, t: (key: string) => key },
    },
  });

  return { wrapper, storeDispatch };
};

const saveButton = (wrapper: any) => wrapper.find('[data-testid="auth-provider-access-save"]');

describe('component: AuthProviderAccessDrawer', () => {
  // The list holds the management copy of a provider, but who may log in is
  // written through the Norman one.
  it('should edit a clone of the provider rather than the cached resource', async() => {
    const model = createModel();
    const { wrapper, storeDispatch } = createWrapper({ model });

    await flushPromises();

    expect(storeDispatch).toHaveBeenCalledWith('rancher/find', {
      type: 'authconfig',
      id:   'github',
      opt:  { url: '/v3/authconfig/github', force: true },
    });

    const form = wrapper.findComponent(AllowedPrincipals);

    expect(form.props('authConfig')).toStrictEqual(model);
    expect(form.props('mode')).toBe('edit');
  });

  it('should say it is loading until the provider has been read', async() => {
    let finish = (_model: any) => undefined as void;
    const model = createModel();
    const dispatch = jest.fn().mockImplementation((action: string) => {
      if (action === 'rancher/clone') {
        return new Promise((resolve) => {
          finish = resolve;
        });
      }

      return Promise.resolve({ id: 'github' });
    });

    const { wrapper } = createWrapper({ dispatch });

    await flushPromises();

    expect(wrapper.findComponent(Loading).exists()).toBe(true);
    expect(wrapper.findComponent(AllowedPrincipals).exists()).toBe(false);

    finish(model);
    await flushPromises();

    expect(wrapper.findComponent(Loading).exists()).toBe(false);
    expect(wrapper.findComponent(AllowedPrincipals).props('authConfig')).toStrictEqual(model);
  });

  it('should stop saying it is loading once the provider fails to load', async() => {
    const dispatch = jest.fn().mockRejectedValue(new Error('gone'));
    const { wrapper } = createWrapper({ dispatch });

    await flushPromises();

    expect(wrapper.findComponent(Loading).exists()).toBe(false);
  });

  // The drawer body is a plain canvas, so the form needs a surface of its own to
  // read as a form, and it is too narrow for the two columns the page uses.
  it('should show the form on a card in a single column', async() => {
    const { wrapper } = createWrapper();

    await flushPromises();

    const card = wrapper.find('.drawer-card');

    expect(card.findComponent(AllowedPrincipals).exists()).toBe(true);
    expect(wrapper.findComponent(AllowedPrincipals).props('stacked')).toBe(true);
  });

  // The panel is drawn above the body, so member search results put there are
  // hidden behind it.
  it('should keep the member search results inside the panel', async() => {
    const { wrapper } = createWrapper();

    await flushPromises();

    expect(wrapper.findComponent(AllowedPrincipals).props('appendSearchToBody')).toBe(false);
  });

  // The credentials an oauth provider hands back cannot be sent again, and the
  // save is rejected if they are.
  it('should leave the write-only credentials out of an oauth save', async() => {
    const model = createModel();
    const { wrapper } = createWrapper({ model });

    await flushPromises();
    await saveButton(wrapper).trigger('click');

    expect(model.save).toHaveBeenCalledWith({ ignoreFields: ['oauthCredential', 'serviceAccountCredential'] });
  });

  it('should save a provider that has no such credentials as it is', async() => {
    const model = createModel({ id: 'okta' });
    const { wrapper } = createWrapper({ resource: { id: 'okta', nameDisplay: 'Okta' } as any, model });

    await flushPromises();
    await saveButton(wrapper).trigger('click');

    expect(model.save).toHaveBeenCalledWith();
  });

  it('should close once the change is written', async() => {
    const { wrapper } = createWrapper();

    await flushPromises();
    await saveButton(wrapper).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  // Closing on a failed save would lose the edit and say nothing about why.
  it('should stay open and explain a save that fails', async() => {
    const model = createModel({ save: jest.fn().mockRejectedValue(new Error('nope')) });
    const { wrapper } = createWrapper({ model });

    await flushPromises();
    await saveButton(wrapper).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('close')).toBeUndefined();
    expect(wrapper.text()).toContain('nope');
  });

  it('should explain a provider it cannot load', async() => {
    const dispatch = jest.fn().mockRejectedValue(new Error('gone'));
    const { wrapper } = createWrapper({ dispatch });

    await flushPromises();

    expect(wrapper.findComponent(AllowedPrincipals).exists()).toBe(false);
    expect(wrapper.text()).toContain('gone');
  });

  // Offering a save that the server will refuse is worse than not offering one.
  it('should show the access of a provider the user cannot change without a way to save it', async() => {
    const { wrapper } = createWrapper({
      resource: {
        id: 'github', nameDisplay: 'GitHub', canUpdate: false
      } as any
    });

    await flushPromises();

    expect(wrapper.findComponent(AllowedPrincipals).props('mode')).toBe('view');
    expect(saveButton(wrapper).exists()).toBe(false);
  });
});
