import { shallowMount } from '@vue/test-utils';
import AuthBanner from '@shell/components/auth/AuthBanner.vue';

const tArgs = { provider: 'Microsoft Entra ID' };

const baseGetters = {
  'features/get':         () => false,
  'management/schemaFor': () => ({ resourceMethods: ['PUT'] }),
  'management/byId':      () => ({ spec: { value: true }, status: { lockedValue: null } }),
};

const createWrapper = (props = {}, getters = {}, configs: any[] = []) => {
  const dispatch = jest.fn((action: string) => (action === 'management/findAll' ? Promise.resolve(configs) : Promise.resolve()));

  const wrapper = shallowMount(AuthBanner, {
    props: {
      tArgs,
      disable:    jest.fn(),
      edit:       jest.fn(),
      providerId: 'entraid',
      ...props,
    },
    global: {
      mocks: {
        $store: {
          dispatch,
          getters: { ...baseGetters, ...getters },
        },
      },
    },
  });

  return { wrapper, dispatch };
};

// The banner reads the other providers before it picks a dialog, so the modal is
// no longer the first thing dispatched.
const modalCall = (dispatch: jest.Mock) => dispatch.mock.calls.find(([action]) => action === 'management/promptModal') as any[];

const modalArgs = (dispatch: jest.Mock) => modalCall(dispatch)[1];

describe('component: AuthBanner', () => {
  it('should confirm before disabling rather than disabling outright', async() => {
    const disable = jest.fn();
    const { wrapper, dispatch } = createWrapper({ disable });

    await (wrapper.vm as any).showDisableModal();

    expect(dispatch).toHaveBeenCalledWith('management/promptModal', expect.objectContaining({ component: 'DisableAuthProviderDialog' }));
    expect(disable).not.toHaveBeenCalled();
  });

  it('should tell the dialog which provider is being disabled', async() => {
    const { wrapper, dispatch } = createWrapper();

    await (wrapper.vm as any).showDisableModal();

    expect(modalArgs(dispatch).componentProps.name).toBe('Microsoft Entra ID');
  });

  it('should disable only once the dialog calls back', async() => {
    const disable = jest.fn();
    const { wrapper, dispatch } = createWrapper({ disable });

    await (wrapper.vm as any).showDisableModal();

    expect(disable).not.toHaveBeenCalled();

    modalArgs(dispatch).componentProps.disableCb();

    expect(disable).toHaveBeenCalledWith();
  });

  // AppModal drops a width carrying no unit and falls back to its own default,
  // so the dialog would quietly render narrower than it was asked to be.
  it('should ask for a width the modal can use', async() => {
    const { wrapper, dispatch } = createWrapper();

    await (wrapper.vm as any).showDisableModal();

    expect(modalArgs(dispatch).modalWidth).toMatch(/(px|%)$/);
  });

  // The provider page is a second way to reach Disable, so it has to refuse the
  // lockout too -- guarding only the list would leave the hole open.
  describe('when it would be the last way in', () => {
    const lockedOut = { 'features/get': () => true };
    const configs = [{ id: 'local', enabled: true }, { id: 'entraid', enabled: true }];

    it('should offer to turn local login back on instead of disabling', async() => {
      const { wrapper, dispatch } = createWrapper({}, lockedOut, configs);

      await (wrapper.vm as any).showDisableModal();

      expect(modalArgs(dispatch).component).toBe('DisableLastAuthProviderDialog');
    });

    it('should not hand the dialog a way to disable the provider', async() => {
      const disable = jest.fn();
      const { wrapper, dispatch } = createWrapper({ disable }, lockedOut, configs);

      await (wrapper.vm as any).showDisableModal();

      expect(modalArgs(dispatch).componentProps.disableCb).toBeUndefined();
      expect(disable).not.toHaveBeenCalled();
    });

    it('should keep the ordinary dialog while another provider is still enabled', async() => {
      const { wrapper, dispatch } = createWrapper({}, lockedOut, [...configs, { id: 'okta', enabled: true }]);

      await (wrapper.vm as any).showDisableModal();

      expect(modalArgs(dispatch).component).toBe('DisableAuthProviderDialog');
    });
  });
});
