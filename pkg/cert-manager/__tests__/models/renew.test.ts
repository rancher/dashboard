import Certificate from '../../models/cert-manager.io.certificate';

const READY = {
  type: 'Ready', status: 'True', message: 'Certificate is up to date and has not expired'
};

interface Options {
  live?: any;
  getRejects?: any;
  putRejects?: any;
  hasUpdateLink?: boolean;
  notAfter?: string;
}

function certificate(opts: Options = {}) {
  // `this.$dispatch(action, payload)` - the request options are the second argument.
  const dispatch = jest.fn((_action: string, payload?: any) => {
    const opt = payload?.opt;

    if (opt?.method === 'get') {
      if (opts.getRejects) {
        return Promise.reject(opts.getRejects);
      }

      return Promise.resolve(JSON.parse(JSON.stringify(opts.live ?? { metadata: { name: 'my-cert' }, status: { conditions: [READY] } })));
    }

    if (opt?.method === 'put' && opts.putRejects) {
      return Promise.reject(opts.putRejects);
    }

    return Promise.resolve({});
  });

  const ctx = {
    type:         'cert-manager.io.certificate',
    metadata:     { name: 'my-cert', namespace: 'default' },
    spec:         {},
    status:       { notAfter: 'notAfter' in opts ? opts.notAfter : '2030-01-01T00:00:00Z' },
    nameDisplay:  'my-cert',
    t:            (key: string) => key,
    hasLink:      () => opts.hasUpdateLink ?? true,
    $dispatch:    dispatch,
    $rootGetters: { clusterId: 'c-m-abc123' },
  };

  return { model: Object.create(Certificate.prototype, Object.getOwnPropertyDescriptors(ctx)) as any, dispatch };
}

const URL = '/k8s/clusters/c-m-abc123/apis/cert-manager.io/v1/namespaces/default/certificates/my-cert/status';

const callWith = (dispatch: jest.Mock, method: string) => dispatch.mock.calls.find(([, payload]) => payload?.opt?.method === method)?.[1];

const growl = (dispatch: jest.Mock, kind: string) => dispatch.mock.calls.find(([action]) => action === `growl/${ kind }`);

describe('model: Certificate renew', () => {
  describe('availability', () => {
    it('should be offered for a certificate that has issued', () => {
      expect(certificate().model.canRenew).toBe(true);
    });

    it('should not be offered before anything has been issued', () => {
      expect(certificate({ notAfter: undefined }).model.canRenew).toBe(false);
    });

    it('should not be offered without update permission', () => {
      expect(certificate({ hasUpdateLink: false }).model.canRenew).toBe(false);
    });

    it('should appear first in the action list', () => {
      const { model } = certificate();

      Object.defineProperty(Object.getPrototypeOf(Object.getPrototypeOf(model)), '_availableActions', {
        get:          () => [{ action: 'goToEdit' }],
        configurable: true,
      });

      expect(model._availableActions[0].action).toBe('renew');
    });
  });

  describe('the request', () => {
    it('should read and write the status subresource through the k8s proxy', async() => {
      const { model, dispatch } = certificate();

      await model.renew();

      expect(callWith(dispatch, 'get').opt.url).toBe(URL);
      expect(callWith(dispatch, 'put').opt.url).toBe(URL);
    });

    it('should PUT json rather than a merge patch', async() => {
      // A merge patch on `conditions` replaces the whole list, silently dropping Ready.
      const { model, dispatch } = certificate();

      await model.renew();

      const put = callWith(dispatch, 'put');

      expect(put.opt.method).toBe('put');
      expect(put.opt.headers['content-type']).toBe('application/json');
    });

    it('should add an Issuing condition marked as manually triggered', async() => {
      const { model, dispatch } = certificate();

      await model.renew();

      const issuing = callWith(dispatch, 'put').opt.data.status.conditions.find((c: any) => c.type === 'Issuing');

      expect(issuing).toMatchObject({
        type: 'Issuing', status: 'True', reason: 'ManuallyTriggered'
      });
      expect(issuing.lastTransitionTime).toEqual(expect.any(String));
    });

    it('should keep the existing Ready condition', async() => {
      const { model, dispatch } = certificate();

      await model.renew();

      const conditions = callWith(dispatch, 'put').opt.data.status.conditions;

      expect(conditions).toContainEqual(READY);
    });

    it('should replace an existing Issuing condition rather than duplicating it', async() => {
      const live = {
        metadata: { name: 'my-cert' },
        status:   {
          conditions: [READY, {
            type: 'Issuing', status: 'False', reason: 'Stale'
          }],
        },
      };
      const { model, dispatch } = certificate({ live });

      await model.renew();

      const conditions = callWith(dispatch, 'put').opt.data.status.conditions;
      const issuing = conditions.filter((c: any) => c.type === 'Issuing');

      expect(issuing).toHaveLength(1);
      expect(issuing[0].reason).toBe('ManuallyTriggered');
    });

    it('should cope with a certificate that has no status yet', async() => {
      const { model, dispatch } = certificate({ live: { metadata: { name: 'my-cert' } } });

      await model.renew();

      expect(callWith(dispatch, 'put').opt.data.status.conditions).toHaveLength(1);
    });

    it('should send back the object it read, not the Steve model', async() => {
      // Steve models carry id/type/links, which the API server rejects on a PUT.
      const live = { metadata: { name: 'my-cert', resourceVersion: '42' }, status: { conditions: [] } };
      const { model, dispatch } = certificate({ live });

      await model.renew();

      const data = callWith(dispatch, 'put').opt.data;

      expect(data.metadata.resourceVersion).toBe('42');
      expect(data.type).toBeUndefined();
      expect(data.links).toBeUndefined();
    });
  });

  describe('feedback', () => {
    it('should confirm success', async() => {
      const { model, dispatch } = certificate();

      await model.renew();

      expect(growl(dispatch, 'success')).toBeDefined();
      expect(growl(dispatch, 'error')).toBeUndefined();
    });

    it('should point at cmctl when the user cannot write certificate status', async() => {
      const { model, dispatch } = certificate({ putRejects: { _status: 403 } });

      await model.renew();

      expect(growl(dispatch, 'error')[1].message).toBe('certManager.action.renew.error.forbidden');
    });

    it('should surface any other failure message', async() => {
      const { model, dispatch } = certificate({ getRejects: { _status: 500, message: 'boom' } });

      await model.renew();

      expect(growl(dispatch, 'error')[1].message).toBe('boom');
    });

    it('should not throw when the request fails', async() => {
      const { model } = certificate({ putRejects: new Error('network down') });

      await expect(model.renew()).resolves.toBeUndefined();
    });
  });
});
