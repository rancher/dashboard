import { nextTick, reactive } from 'vue';
import { shallowMount } from '@vue/test-utils';
import OidcClientDetail from '@shell/detail/management.cattle.io.oidcclient.vue';
import { SECRET } from '@shell/config/types';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

const SECRET_ID = 'cattle-oidc-client-secrets/client-abc';

describe('view: management.cattle.io.oidcclient', () => {
  const createClient = (clientSecrets: Record<string, any>) => reactive({
    metadata: {
      annotations:   {},
      relationships: [{
        rel: 'owner', state: 'active', toType: SECRET, toId: SECRET_ID
      }]
    },
    status: { clientID: 'client-abc', clientSecrets },
    save:   jest.fn().mockResolvedValue({}),
  });

  const createWrapper = (value: any, { canList = true, decodedData }: { canList?: boolean, decodedData?: Record<string, string> } = {}) => {
    const store = reactive({ secret: decodedData ? { decodedData } : undefined });
    const dispatch = jest.fn();

    const wrapper = shallowMount(OidcClientDetail as any, {
      props:  { value },
      global: {
        mocks: {
          $store: {
            getters: {
              'management/canList': () => canList,
              'management/byId':    () => store.secret,
            },
            dispatch,
          },
          t: (key: string) => key,
        },
      },
    });

    return {
      wrapper, store, dispatch
    };
  };

  const forceFetchCall = ['management/find', {
    type: SECRET, id: SECRET_ID, opt: { force: true }
  }];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches the client secret on load', () => {
    const value = createClient({ 'client-secret-1': { lastFiveCharacters: 'aaaaa' } });
    const { dispatch } = createWrapper(value);

    expect(dispatch).toHaveBeenCalledWith('management/find', {
      type: SECRET, id: SECRET_ID, opt: { force: false }
    });
  });

  it('does not fetch the client secret when the client has no relationships yet', () => {
    const value = createClient({});

    value.metadata.relationships = null as any;
    const { dispatch } = createWrapper(value);

    expect(dispatch).not.toHaveBeenCalledWith('management/find', expect.anything());
  });

  it('does not fetch the client secret when the user cannot list secrets', () => {
    const value = createClient({ 'client-secret-1': { lastFiveCharacters: 'aaaaa' } });
    const { dispatch } = createWrapper(value, { canList: false });

    expect(dispatch).not.toHaveBeenCalledWith('management/find', expect.anything());
  });

  it('shows the full value of a secret added after the page loaded', async() => {
    const value = createClient({ 'client-secret-1': { lastFiveCharacters: 'aaaaa' } });
    const { wrapper } = createWrapper(value, { decodedData: { 'client-secret-1': 'secret-aaaaa' } });

    value.status.clientSecrets = { ...value.status.clientSecrets, 'client-secret-2': { lastFiveCharacters: 'bbbbb' } };
    await nextTick();

    const added = wrapper.vm.clientSecrets.find((s: any) => s.id === 'client-secret-2');

    expect(added.displayFullSecret).toBe(true);
  });

  it('refetches the client secret when an added secret is missing from it', async() => {
    const value = createClient({ 'client-secret-1': { lastFiveCharacters: 'aaaaa' } });
    const { dispatch } = createWrapper(value, { decodedData: { 'client-secret-1': 'secret-aaaaa' } });

    value.status.clientSecrets = { ...value.status.clientSecrets, 'client-secret-2': { lastFiveCharacters: 'bbbbb' } };
    await nextTick();

    expect(dispatch).toHaveBeenCalledWith(...forceFetchCall);
  });

  it('refetches the client secret when a regenerated secret still has the old value', async() => {
    const value = createClient({ 'client-secret-1': { lastFiveCharacters: 'aaaaa' } });
    const { wrapper, dispatch } = createWrapper(value, { decodedData: { 'client-secret-1': 'secret-aaaaa' } });

    await wrapper.vm.performSecretAction('regen-secret', wrapper.vm.clientSecrets[0]);
    value.status.clientSecrets = { 'client-secret-1': { lastFiveCharacters: 'ccccc' } };
    await nextTick();

    expect(dispatch).toHaveBeenCalledWith(...forceFetchCall);
  });

  it('does not refetch the client secret when it already has the new value', async() => {
    const value = createClient({ 'client-secret-1': { lastFiveCharacters: 'aaaaa' } });
    const { store, dispatch } = createWrapper(value, { decodedData: { 'client-secret-1': 'secret-aaaaa' } });

    store.secret = { decodedData: { 'client-secret-1': 'secret-aaaaa', 'client-secret-2': 'secret-bbbbb' } };
    value.status.clientSecrets = { ...value.status.clientSecrets, 'client-secret-2': { lastFiveCharacters: 'bbbbb' } };
    await nextTick();

    expect(dispatch).not.toHaveBeenCalledWith(...forceFetchCall);
  });

  it('does not refetch the client secret before it has loaded', async() => {
    const value = createClient({ 'client-secret-1': { lastFiveCharacters: 'aaaaa' } });
    const { dispatch } = createWrapper(value);

    value.status.clientSecrets = { ...value.status.clientSecrets, 'client-secret-2': { lastFiveCharacters: 'bbbbb' } };
    await nextTick();

    expect(dispatch).not.toHaveBeenCalledWith(...forceFetchCall);
  });

  it('rejects an unknown secret action', async() => {
    const value = createClient({});
    const { wrapper } = createWrapper(value);

    await expect(wrapper.vm.performSecretAction('unknown', {})).rejects.toThrow('oidcclient.errors.performSecretAction');
  });
});
