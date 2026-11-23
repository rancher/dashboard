import { actions, getters, mutations, state } from '@shell/store/auth';
import { openAuthPopup } from '@shell/utils/auth';
import { createStore } from 'vuex';

// jest.mock('@shell/utils/url', () => ({
//   addParams:   () => ({}),
//   parse:       () => ({}),
//   removeParam: () => ({}),
// }));

describe('action: redirectTo', () => {
  it('should include query parameters from redirect', async() => {
    jest.spyOn(window, 'window', 'get');
    const store = {
      dispatch: jest.fn((x) => {
        if (x === 'getAuthProvider') return { scopes: '' };
      })
    };
    const clientId = '123';
    const uri = 'anyURI';
    const scope = 'anything';
    const expectation = `:///?client_id=${ clientId }&redirect_uri=${ uri }&response_type=code&response_mode=query&scope=${ scope }&state=undefined`;
    const options = {
      provider:    'azuread',
      redirect:    false,
      redirectUrl: `?client_id=${ clientId }&redirect_uri=${ uri }&scope=${ scope }`,
    };

    const url = await actions.redirectTo(store as any, options);

    expect(url).toStrictEqual(expectation);
  });

  it('should apply the azure specific parameters to a renamed azure config', async() => {
    jest.spyOn(window, 'window', 'get');
    const store = {
      dispatch: jest.fn((x) => {
        if (x === 'getAuthProvider') return { type: 'azureADProvider', scopes: '' };
      })
    };
    const options = {
      provider:    'entra-prod',
      redirect:    false,
      redirectUrl: '?client_id=123',
    };

    const url = await actions.redirectTo(store as any, options);

    expect(url).toContain('response_mode=query');
  });

  it('should apply the base scopes of a renamed config', async() => {
    jest.spyOn(window, 'window', 'get');
    const store = {
      dispatch: jest.fn((x) => {
        if (x === 'getAuthProvider') return { type: 'githubProvider', scopes: '' };
      })
    };
    const options = {
      provider:    'github-two',
      redirect:    false,
      redirectUrl: '?client_id=123',
    };

    const url = await actions.redirectTo(store as any, options);

    expect(url).toContain('scope=read%3Aorg');
  });

  it.each([
    ['genericoidc', '://myhost/?redirect_uri=anyURI&scope=openid%20profile%20email%20groups&state=undefined'],
  ])('given provider %p should return URL %p', async(provider, expectation) => {
    jest.spyOn(window, 'window', 'get');
    const store = {
      dispatch: jest.fn((x) => {
        if (x === 'getAuthProvider') return { scopes: 'groups' };
      })
    };
    const uri = 'anyURI'; // This field is added anyway, so we set a random value
    const options = {
      provider,
      redirect:    false,
      redirectUrl: `myhost?redirect_uri=${ uri }`,
    };

    const url = await actions.redirectTo(store as any, options);

    expect(url).toStrictEqual(expectation);
  });

  describe.each([
    // 'whatever',
    // 'github',
    // 'googleoauth',
    // 'azuread',
    // 'keycloakoidc',
    'genericoidc',
  ])('given provider %p', (provider) => {
    it('should keep scope from options', async() => {
      const customScope = 'myScope';
      const options = {
        provider,
        redirectUrl: 'anyURL',
        scopes:      customScope,
        // scopesJoinChar: ' ', // it's not used for genericoidc
        test:        true,
        redirect:    false
      };
      const store = {
        dispatch: jest.fn((x) => {
          if (x === 'getAuthProvider') return { scopes: '' };
        })
      };

      jest.spyOn(window, 'window', 'get');
      const url = await actions.redirectTo(store as any, options);

      expect(url).toContain(customScope);
    });

    it('should merge scopes into a single string and avoid duplication', async() => {
      const defaultScopes = 'openid profile email';
      const customScope = 'myScope';
      const options = {
        provider,
        redirectUrl: 'anyURL',
        scopes:      `${ defaultScopes } ${ customScope }`,
        test:        true,
        redirect:    false
      };
      const store = {
        dispatch: jest.fn((x) => {
          if (x === 'getAuthProvider') return { scopes: 'openid' };
        })
      };

      jest.spyOn(window, 'window', 'get');
      const url = await actions.redirectTo(store as any, options);

      expect(url).toContain('scope=openid%20profile%20email%20myScope&');
    });
  });
});

jest.mock('@shell/utils/auth');

describe('action: test', () => {
  describe('given providers with an action (github, google, azuread, oidc)', () => {
    it('should call redirectTo with all the options', async() => {
      const dispatchSpy = jest.fn().mockReturnValue('anyURL');
      const store = createStore({
        actions: {
          getAuthConfig: () => ({ doAction: () => 'no action' }),
          redirectTo:    dispatchSpy,
        }
      });
      const provider = 'anyProvider';
      const redirectUrl = undefined;
      const body = { scope: ['any scope'] };
      const options = {
        provider,
        providerType: 'any',
        redirectUrl,
        scopes:       body.scope,
        test:         true,
        redirect:     false
      };

      await actions.test(store, { provider, body });

      expect(dispatchSpy.mock.calls[0][1]).toStrictEqual(options);
    });

    it('should derive the provider type from the config rather than its name', async() => {
      const dispatchSpy = jest.fn().mockReturnValue('anyURL');
      const store = createStore({
        actions: {
          getAuthConfig: () => ({ _type: 'githubConfig', doAction: () => 'no action' }),
          redirectTo:    dispatchSpy,
        }
      });

      await actions.test(store, { provider: 'github-two', body: {} });

      expect(dispatchSpy.mock.calls[0][1]).toStrictEqual(expect.objectContaining({
        provider:     'github-two',
        providerType: 'github',
      }));
    });
  });

  describe('given saml providers', () => {
    it('should tell testAndEnable which of the provider\'s configs is being enabled', async() => {
      const doAction = jest.fn().mockResolvedValue({ idpRedirectUrl: 'anyURL' });
      const store = createStore({
        actions: {
          getAuthConfig: () => ({
            id: 'okta-two', _type: 'oktaConfig', actions: { testAndEnable: 'anyLink' }, doAction
          }),
        }
      });

      await actions.test(store, { provider: 'okta-two', body: {} });

      expect(doAction).toHaveBeenCalledWith('testAndEnable', {
        finalRedirectUrl: undefined,
        configName:       'okta-two',
      });
    });

    it('should open the popup against the kind of provider rather than the config name', async() => {
      const store = createStore({
        actions: {
          getAuthConfig: () => ({
            id:       'okta-two',
            _type:    'oktaConfig',
            actions:  { testAndEnable: 'anyLink' },
            doAction: () => ({ idpRedirectUrl: 'anyURL' }),
          }),
        }
      });

      await actions.test(store, { provider: 'okta-two', body: {} });

      expect(openAuthPopup).toHaveBeenCalledWith('anyURL', 'okta');
    });
  });
});

describe('action: login', () => {
  it('should send both the config name and the type of the auth config to log in against', async() => {
    const dispatch = jest.fn((action) => {
      if (action === 'getAuthProvider') {
        return { id: 'github-two', type: 'githubProvider' };
      }
    });

    await actions.login({ dispatch } as any, { provider: 'github-two', body: { code: 'anyCode' } });

    expect(dispatch).toHaveBeenCalledWith(
      'management/request',
      expect.objectContaining({
        data: {
          configName:   'github-two',
          type:         'githubProvider',
          description:  'UI session',
          responseType: 'cookie',
          code:         'anyCode',
        }
      }),
      { root: true }
    );
  });
});

describe('action: getAuthProviderTypes', () => {
  // Nothing is pre-created any more, so the catalogue of what can be added has
  // to come from the server rather than from the configs that already exist.
  it('should ask the server what it can be configured with', async() => {
    const types = { githubProvider: { Description: 'GitHub authentication OAuth provider', Type: 'oauth' } };
    const dispatch = jest.fn().mockResolvedValue(types);

    const result = await actions.getAuthProviderTypes({ dispatch } as any);

    expect(dispatch).toHaveBeenCalledWith('rancher/request', { url: '/v1-public/authprovider-types' }, { root: true });
    expect(result).toStrictEqual(types);
  });
});

describe('action: getLocalProviderEnabled', () => {
  it('should return true if local auth provider exists', async() => {
    const dispatch = jest.fn().mockResolvedValue({ id: 'local' });
    const result = await actions.getLocalProviderEnabled({ dispatch } as any);

    expect(dispatch).toHaveBeenCalledWith('getAuthProvider', 'local');
    expect(result).toBe(true);
  });

  it('should return false if local auth provider does not exist', async() => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    const result = await actions.getLocalProviderEnabled({ dispatch } as any);

    expect(dispatch).toHaveBeenCalledWith('getAuthProvider', 'local');
    expect(result).toBe(false);
  });
});

describe('impersonation lifecycle actions', () => {
  it('starts with an unknown impersonation status', () => {
    expect(state().impersonationStatus).toStrictEqual('unknown');
  });

  it('starts impersonation and updates the effective principal', async() => {
    const dispatch = jest.fn().mockResolvedValue({ userId: 'u-target', principalId: 'local://target' });
    const commit = jest.fn();

    await actions.startImpersonation({ dispatch, commit } as any, 'u-target');

    expect(dispatch).toHaveBeenCalledWith('management/request', {
      url:    '/v3/impersonation-sessions',
      method: 'post',
      data:   { userId: 'u-target' },
    }, { root: true });
    expect(commit).toHaveBeenCalledWith('impersonationStarted', { userId: 'u-target', principalId: 'local://target' });
    expect(commit).toHaveBeenCalledWith('loggedInAs', 'local://target');
    expect(commit).toHaveBeenCalledWith('clearUserCache');
  });

  it('does not update state when starting impersonation fails', async() => {
    const error = { status: 403 };
    const dispatch = jest.fn().mockRejectedValue(error);
    const commit = jest.fn();

    await expect(actions.startImpersonation({ dispatch, commit } as any, 'u-target')).rejects.toStrictEqual(error);

    expect(commit).not.toHaveBeenCalledWith('impersonationStarted', expect.anything());
  });

  it('restores an active impersonation session after reload', async() => {
    const session = {
      userId: 'u-target', principalId: 'local://target', impersonating: true
    };
    const dispatch = jest.fn().mockResolvedValue(session);
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };

    await actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    expect(dispatch).toHaveBeenCalledWith('management/request', { url: '/v3/impersonation-sessions/current' }, { root: true });
    expect(commit).toHaveBeenCalledWith('impersonationStarted', session);
    expect(commit).toHaveBeenCalledWith('impersonationStatus', 'loading');
  });

  it('treats a missing session as the normal restored state', async() => {
    const dispatch = jest.fn().mockRejectedValue({ status: 404 });
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };

    await expect(actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any)).resolves.toStrictEqual(null);

    expect(commit).toHaveBeenCalledWith('impersonationStopped');
  });

  it.each([
    { description: '401', error: { status: 401 } },
    { description: '403', error: { status: 403 } },
    { description: '409', error: { status: 409 } },
    { description: '500', error: { status: 500 } },
    { description: 'network error', error: new Error('network error') },
  ])('propagates unexpected restore failures for $description', async({ error }) => {
    const dispatch = jest.fn().mockRejectedValue(error);
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };

    await expect(actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any)).rejects.toStrictEqual(error);

    expect(commit).toHaveBeenCalledWith('impersonationStatus', 'unknown');
  });

  it('retries after an unexpected restore failure', async() => {
    const error = { status: 500 };
    const dispatch = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        userId: 'u-target', principalId: 'local://target', impersonating: true
      });
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };

    await expect(actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any)).rejects.toStrictEqual(error);
    await expect(actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any)).resolves.toStrictEqual({
      userId:        'u-target',
      principalId:   'local://target',
      impersonating: true
    });
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('returns to unknown for a malformed successful response', async() => {
    const dispatch = jest.fn().mockResolvedValue({ impersonating: true });
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };

    await expect(actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any)).rejects.toThrow('invalid impersonation session response');

    expect(commit).toHaveBeenCalledWith('impersonationStatus', 'unknown');
  });

  it('does not request when status is already active or inactive', async() => {
    const dispatch = jest.fn();
    const commit = jest.fn();
    const session = {
      userId: 'u-target', principalId: 'local://target', impersonating: true
    };

    await expect(actions.restoreImpersonation({
      dispatch, commit, state: { impersonation: session, impersonationStatus: 'active' }
    } as any)).resolves.toStrictEqual(session);
    await expect(actions.restoreImpersonation({
      dispatch, commit, state: { impersonation: null, impersonationStatus: 'inactive' }
    } as any)).resolves.toStrictEqual(null);
    expect(dispatch).not.toHaveBeenCalledWith('management/request', expect.anything(), expect.anything());
  });

  it('deduplicates concurrent status restoration requests and shares the result', async() => {
    let resolveRequest: (session: object) => void = () => {};
    const dispatch = jest.fn().mockReturnValue(new Promise<object>((resolve) => {
      resolveRequest = resolve;
    }));
    const commit = jest.fn();
    const restoreState = { impersonationStatus: 'unknown', impersonation: null };

    const first = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);
    const second = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    expect(dispatch).toHaveBeenCalledTimes(1);
    const session = {
      userId: 'u-target', principalId: 'local://target', impersonating: true
    };

    resolveRequest(session);
    await expect(Promise.all([first, second])).resolves.toStrictEqual([session, session]);
  });

  it('does not create a request or reload loop during repeated initialization', async() => {
    let resolveRequest: (session: object) => void = () => {};
    const session = {
      userId: 'u-target', principalId: 'local://target', impersonating: true
    };
    const dispatch = jest.fn().mockReturnValue(new Promise<object>((resolve) => {
      resolveRequest = resolve;
    }));
    const restoreState = state();
    const commit = (mutation: string, payload?: unknown) => {
      (mutations as any)[mutation](restoreState, payload);
    };
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    const first = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);
    const second = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    expect(dispatch).toHaveBeenCalledTimes(1);
    resolveRequest(session);
    await expect(Promise.all([first, second])).resolves.toStrictEqual([session, session]);

    await expect(actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any)).resolves.toStrictEqual(session);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalledWith();
    location.mockRestore();
  });

  it('shares concurrent rejection and returns to unknown', async() => {
    let rejectRequest: (error: object) => void = () => {};
    const error = { status: 500 };
    const dispatch = jest.fn().mockReturnValue(new Promise<object>((_resolve, reject) => {
      rejectRequest = reject;
    }));
    const commit = jest.fn();
    const restoreState = { impersonationStatus: 'unknown', impersonation: null };

    const first = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);
    const second = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    rejectRequest(error);
    await expect(Promise.allSettled([first, second])).resolves.toStrictEqual([
      { status: 'rejected', reason: error },
      { status: 'rejected', reason: error }
    ]);
    expect(commit).toHaveBeenCalledWith('impersonationStatus', 'unknown');
  });

  it('does not let a pending restore overwrite a newer start', async() => {
    let resolveRestore: (session: object) => void = () => {};
    const restoreSession = {
      userId: 'u-old', principalId: 'local://old', impersonating: true
    };
    const startedSession = {
      userId: 'u-new', principalId: 'local://new', impersonating: true
    };
    const dispatch = jest.fn()
      .mockReturnValueOnce(new Promise<object>((resolve) => {
        resolveRestore = resolve;
      }))
      .mockResolvedValueOnce(startedSession);
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };

    const restore = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    await actions.startImpersonation({ dispatch, commit }, 'u-new');
    resolveRestore(restoreSession);
    await restore;

    expect(commit).toHaveBeenCalledWith('impersonationStarted', startedSession);
    expect(commit).not.toHaveBeenCalledWith('impersonationStarted', restoreSession);
  });

  it('does not let a pending restore overwrite logout', async() => {
    let resolveRestore: (session: object) => void = () => {};
    const dispatch = jest.fn().mockReturnValue(new Promise<object>((resolve) => {
      resolveRestore = resolve;
    }));
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };

    const restore = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    mutations.loggedOut(restoreState);
    resolveRestore({
      userId: 'u-old', principalId: 'local://old', impersonating: true
    });
    await restore;

    expect(commit).not.toHaveBeenCalledWith('impersonationStarted', expect.anything());
    expect(restoreState.impersonationStatus).toStrictEqual('unknown');
  });

  it('does not reuse a pending restore promise after logout', async() => {
    let resolveFirst: (session: object) => void = () => {};
    const session = {
      userId: 'u-target', principalId: 'local://target', impersonating: true
    };
    const dispatch = jest.fn()
      .mockReturnValueOnce(new Promise<object>((resolve) => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce(session);
    const commit = jest.fn();
    const restoreState = state();

    const first = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    mutations.loggedOut(restoreState);
    const second = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    await expect(second).resolves.toStrictEqual(session);
    expect(dispatch).toHaveBeenCalledTimes(2);
    resolveFirst(session);
    await first;
  });

  it('does not let a pending restore overwrite stop', async() => {
    let resolveRestore: (session: object) => void = () => {};
    const dispatch = jest.fn()
      .mockReturnValueOnce(new Promise<object>((resolve) => {
        resolveRestore = resolve;
      }))
      .mockResolvedValueOnce(undefined);
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'unknown' };
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    const restore = actions.restoreImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    await actions.stopImpersonation({ dispatch, commit });
    resolveRestore({
      userId: 'u-old', principalId: 'local://old', impersonating: true
    });
    await restore;

    expect(commit).toHaveBeenCalledWith('impersonationStopped');
    expect(commit).not.toHaveBeenCalledWith('impersonationStarted', expect.anything());
    location.mockRestore();
  });

  it.each(['active', 'loading', 'unknown'])('recovers an expired impersonation session from %s state and reloads once', async(impersonationStatus) => {
    const response = { impersonating: false, restored: true };
    const dispatch = jest.fn().mockResolvedValue(response);
    const commit = jest.fn();
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    await expect(actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus }
    } as any)).resolves.toStrictEqual(response);

    expect(dispatch).toHaveBeenCalledWith('management/request', {
      url:                  '/v3/impersonation-sessions/recover',
      method:               'post',
      redirectUnauthorized: false,
    }, { root: true });
    expect(commit).toHaveBeenCalledWith('impersonationStopped');
    expect(reload).toHaveBeenCalledWith();
    location.mockRestore();
  });

  it('does not attempt recovery for a known inactive session', async() => {
    const dispatch = jest.fn();
    const commit = jest.fn();

    await expect(actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'inactive' }
    } as any)).resolves.toStrictEqual(null);

    expect(dispatch).not.toHaveBeenCalledWith('management/request', expect.anything(), expect.anything());
  });

  it('logs out without reloading when recovery reports no restoration', async() => {
    const response = { impersonating: false, restored: false };
    const dispatch = jest.fn().mockResolvedValue(response);
    const commit = jest.fn();
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    await actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'active' }
    } as any);

    expect(dispatch).toHaveBeenCalledWith('uiLogout', { sessionIdle: false });
    expect(reload).not.toHaveBeenCalledWith();
    location.mockRestore();
  });

  it.each([
    { impersonating: true, restored: true },
    { impersonating: true, restored: false },
  ])('rejects inconsistent recovery response %j', async(response) => {
    const dispatch = jest.fn().mockResolvedValue(response);
    const commit = jest.fn();
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    await expect(actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'active' }
    } as any)).rejects.toThrow('invalid impersonation recovery response');

    expect(commit).toHaveBeenCalledWith('impersonationStatus', 'unknown');
    expect(reload).not.toHaveBeenCalledWith();
    location.mockRestore();
  });

  it('shares concurrent recovery and retries after an unexpected failure', async() => {
    const error = { status: 500 };
    const response = { impersonating: false, restored: true };
    const dispatch = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(response);
    const commit = jest.fn();

    await expect(actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'active' }
    } as any)).rejects.toStrictEqual(error);
    await expect(actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'active' }
    } as any)).resolves.toStrictEqual(response);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent recovery requests', async() => {
    let resolveRequest: (response: object) => void = () => {};
    const response = { impersonating: false, restored: true };
    const dispatch = jest.fn().mockReturnValue(new Promise<object>((resolve) => {
      resolveRequest = resolve;
    }));
    const commit = jest.fn();
    const context = {
      dispatch, commit, state: { impersonationStatus: 'active' }
    };

    const first = actions.recoverImpersonation(context as any);
    const second = actions.recoverImpersonation(context as any);

    expect(dispatch).toHaveBeenCalledTimes(1);
    resolveRequest(response);
    await expect(Promise.all([first, second])).resolves.toStrictEqual([response, response]);
  });

  it.each([
    { status: 409 },
    { status: 500 },
    { message: 'network error' },
  ])('propagates recovery error %j and keeps status unknown', async(error) => {
    const dispatch = jest.fn().mockRejectedValue(error);
    const commit = jest.fn();

    await expect(actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'active' }
    } as any)).rejects.toStrictEqual(error);

    expect(commit).toHaveBeenCalledWith('impersonationStatus', 'unknown');
  });

  it.each(['active', 'loading', 'unknown'])('does not recover a normal logout, but recovers an unauthorized %s session', async(impersonationStatus) => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    const extensionLogout = jest.fn().mockResolvedValue(undefined);

    await actions.logout({
      dispatch,
      getters:   { loggedIn: true, impersonationStatus },
      rootState: { $extension: { logout: extensionLogout } },
    } as any);
    expect(dispatch).toHaveBeenCalledWith('rancher/request', expect.anything(), { root: true });

    dispatch.mockClear();
    await actions.logout({
      dispatch,
      getters:   { loggedIn: true, impersonationStatus },
      rootState: { $extension: { logout: extensionLogout } },
    }, { unauthorized: true } as any);
    expect(dispatch).toHaveBeenCalledWith('recoverImpersonation');
  });

  it('uses normal unauthorized logout for a known inactive session', async() => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    const extensionLogout = jest.fn().mockResolvedValue(undefined);

    await actions.logout({
      dispatch,
      getters:   { loggedIn: true, impersonationStatus: 'inactive' },
      rootState: { $extension: { logout: extensionLogout } },
    }, { unauthorized: true } as any);

    expect(dispatch).not.toHaveBeenCalledWith('recoverImpersonation');
    expect(dispatch).toHaveBeenCalledWith('rancher/request', expect.anything(), { root: true });
  });

  it('does not let pending recovery overwrite a newer start', async() => {
    let resolveRecovery: (response: object) => void = () => {};
    const recoveryResponse = { impersonating: false, restored: true };
    const startedSession = { userId: 'u-new', principalId: 'local://new' };
    const dispatch = jest.fn()
      .mockReturnValueOnce(new Promise<object>((resolve) => {
        resolveRecovery = resolve;
      }))
      .mockResolvedValueOnce(startedSession);
    const commit = jest.fn();
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    const recovery = actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'active' }
    } as any);

    await actions.startImpersonation({ dispatch, commit }, 'u-new');
    resolveRecovery(recoveryResponse);
    await recovery;

    expect(commit).toHaveBeenCalledWith('impersonationStarted', startedSession);
    expect(commit).not.toHaveBeenCalledWith('impersonationStopped');
    expect(reload).not.toHaveBeenCalledWith();
    location.mockRestore();
  });

  it('does not let pending recovery overwrite a newer stop', async() => {
    let resolveRecovery: (response: object) => void = () => {};
    const dispatch = jest.fn()
      .mockReturnValueOnce(new Promise<object>((resolve) => {
        resolveRecovery = resolve;
      }))
      .mockResolvedValueOnce(undefined);
    const commit = jest.fn();
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    const recovery = actions.recoverImpersonation({
      dispatch, commit, state: { impersonationStatus: 'active' }
    } as any);

    await actions.stopImpersonation({ dispatch, commit });
    resolveRecovery({ impersonating: false, restored: true });
    await recovery;

    expect(commit).toHaveBeenCalledWith('impersonationStopped');
    expect(reload).toHaveBeenCalledTimes(1);
    location.mockRestore();
  });

  it('does not let pending recovery overwrite logout', async() => {
    let resolveRecovery: (response: object) => void = () => {};
    const dispatch = jest.fn().mockReturnValue(new Promise<object>((resolve) => {
      resolveRecovery = resolve;
    }));
    const commit = jest.fn();
    const restoreState = { impersonation: null, impersonationStatus: 'active' };

    const recovery = actions.recoverImpersonation({
      dispatch, commit, state: restoreState
    } as any);

    mutations.loggedOut(restoreState);
    resolveRecovery({ impersonating: false, restored: true });
    await recovery;

    expect(commit).not.toHaveBeenCalledWith('impersonationStopped');
    expect(commit).not.toHaveBeenCalledWith('impersonationStarted', expect.anything());
    expect(restoreState.impersonationStatus).toStrictEqual('unknown');
  });

  it('does not reuse a pending recovery promise after logout', async() => {
    let resolveFirst: (response: object) => void = () => {};
    const response = { impersonating: false, restored: true };
    const dispatch = jest.fn()
      .mockReturnValueOnce(new Promise<object>((resolve) => {
        resolveFirst = resolve;
      }))
      .mockResolvedValueOnce(response);
    const commit = jest.fn();
    const recoveryState = state();

    recoveryState.impersonationStatus = 'active';
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);

    const first = actions.recoverImpersonation({
      dispatch, commit, state: recoveryState
    } as any);

    mutations.loggedOut(recoveryState);
    const second = actions.recoverImpersonation({
      dispatch, commit, state: recoveryState
    } as any);

    await expect(second).resolves.toStrictEqual(response);
    expect(dispatch).toHaveBeenCalledTimes(2);
    resolveFirst(response);
    await first;
    location.mockRestore();
  });

  it('stops impersonation and reloads the dashboard', async() => {
    const reload = jest.fn();
    const location = jest.spyOn(window, 'location', 'get').mockReturnValue({ reload } as unknown as Location);
    const dispatch = jest.fn().mockResolvedValue(undefined);
    const commit = jest.fn();

    await actions.stopImpersonation({ dispatch, commit } as any);

    expect(dispatch).toHaveBeenCalledWith('management/request', {
      url:    '/v3/impersonation-sessions/current',
      method: 'delete',
    }, { root: true });
    expect(commit).toHaveBeenCalledWith('impersonationStopped');
    expect(reload).toHaveBeenCalledWith();
    location.mockRestore();
  });

  it('logs out through the Rancher endpoint', async() => {
    const dispatch = jest.fn().mockResolvedValue({});
    const extensionLogout = jest.fn().mockResolvedValue(undefined);

    await actions.logout({
      dispatch,
      getters:   { loggedIn: true },
      rootState: { $extension: { logout: extensionLogout } },
    } as any);

    expect(dispatch).toHaveBeenCalledWith('rancher/request', expect.objectContaining({
      url:    '/v1/logout',
      method: 'post',
    }), { root: true });
    expect(dispatch).toHaveBeenCalledWith('uiLogout', { sessionIdle: undefined });
    expect(extensionLogout).toHaveBeenCalledWith();
  });

  it('exposes only inactive as impersonation-ready', () => {
    expect(getters.impersonationStatusKnown({ impersonationStatus: 'unknown' })).toStrictEqual(false);
    expect(getters.impersonationStatusKnown({ impersonationStatus: 'loading' })).toStrictEqual(false);
    expect(getters.impersonationStatusKnown({ impersonationStatus: 'active' })).toStrictEqual(true);
    expect(getters.impersonationStatusKnown({ impersonationStatus: 'inactive' })).toStrictEqual(true);
  });

  it('sets lifecycle mutations to the expected statuses', () => {
    const current = state();

    mutations.impersonationStarted(current, { userId: 'u-target' });
    expect(current.impersonationStatus).toStrictEqual('active');
    mutations.impersonationStopped(current);
    expect(current.impersonationStatus).toStrictEqual('inactive');
    mutations.loggedOut(current);
    expect(current.impersonationStatus).toStrictEqual('unknown');
  });
});
