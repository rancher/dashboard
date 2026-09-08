import { shallowMount } from '@vue/test-utils';
import AuthBanner from '@shell/components/auth/AuthBanner.vue';

const tArgs = { provider: 'Microsoft Entra ID' };

const createWrapper = (props = {}) => {
  const dispatch = jest.fn();

  const wrapper = shallowMount(AuthBanner, {
    props: {
      tArgs,
      disable: jest.fn(),
      edit:    jest.fn(),
      ...props,
    },
    global: {
      mocks: {
        $store: {
          dispatch,
          getters: { 'features/get': () => false },
        },
      },
    },
  });

  return { wrapper, dispatch };
};

const modalArgs = (dispatch: jest.Mock) => dispatch.mock.calls[0][1];

describe('component: AuthBanner', () => {
  it('should confirm before disabling rather than disabling outright', () => {
    const disable = jest.fn();
    const { wrapper, dispatch } = createWrapper({ disable });

    (wrapper.vm as any).showDisableModal();

    expect(dispatch).toHaveBeenCalledWith('management/promptModal', expect.objectContaining({ component: 'DisableAuthProviderDialog' }));
    expect(disable).not.toHaveBeenCalled();
  });

  it('should tell the dialog which provider is being disabled', () => {
    const { wrapper, dispatch } = createWrapper();

    (wrapper.vm as any).showDisableModal();

    expect(modalArgs(dispatch).componentProps.name).toBe('Microsoft Entra ID');
  });

  it('should disable only once the dialog calls back', () => {
    const disable = jest.fn();
    const { wrapper, dispatch } = createWrapper({ disable });

    (wrapper.vm as any).showDisableModal();

    expect(disable).not.toHaveBeenCalled();

    modalArgs(dispatch).componentProps.disableCb();

    expect(disable).toHaveBeenCalledWith();
  });
});
