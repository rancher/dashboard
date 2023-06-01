
import { actions } from '@shell/plugins/steve/subscribe.js';

describe('plugin: subscribe, actions: ws.resource.change', () => {
  it('should be rke2 growl success', () => {
    const growlSuccess = jest.fn(t => t);
    const ctx = {
      getters: {
        normalizeType: type => type,
        typeEntry:     type => '',
      },
      dispatch:    growlSuccess,
      rootGetters: {
        'management/byId':     (type, id) => ({ nameDisplay: id }),
        'type-map/optionsFor': type => ({ type }),
        'i18n/t':              (type, p) => p?.name ? type + p.name : type
      }
    };
    const data = {
      clusterId: 'test',
      metadata:  {
        state:             { error: false },
        creationTimestamp: new Date()
      },
      spec: { clusterName: 'test' },
      type: 'rke.cattle.io.etcdsnapshot'
    };

    actions['ws.resource.change'](ctx, { data, type: 'rke.cattle.io.etcdsnapshot' });

    expect(growlSuccess).toHaveBeenCalledWith('growl/success', {
      title:   'cluster.snapshot.success.title',
      message: 'cluster.snapshot.success.messagetest',
      err:     'cluster.snapshot.success.messagetest',
    }, { root: true });
  });

  it('should be rke2 growl fail', () => {
    const growlFail = jest.fn(t => t);
    const ctx = {
      getters: {
        normalizeType: type => type,
        typeEntry:     type => '',
      },
      dispatch:    growlFail,
      rootGetters: {
        'management/byId':     (type, id) => ({ nameDisplay: id }),
        'type-map/optionsFor': type => ({ type }),
        'i18n/t':              (type, p) => p?.name ? type + p.name : type
      }
    };
    const data = {
      metadata: {
        state:             { error: true },
        creationTimestamp: new Date()
      },
      spec: { clusterName: 'testFail' },
      type: 'rke.cattle.io.etcdsnapshot'
    };

    actions['ws.resource.change'](ctx, { data, type: 'rke.cattle.io.etcdsnapshot' });

    expect(growlFail).toHaveBeenCalledWith('growl/fromError', {
      title:   'cluster.snapshot.fail.title',
      message: 'cluster.snapshot.fail.messagetestFail',
      err:     'cluster.snapshot.fail.messagetestFail',
    }, { root: true });
  });

  it('should be rke growl success', () => {
    const growlSuccess = jest.fn(t => t);
    const ctx = {
      getters: {
        normalizeType: type => type,
        typeEntry:     type => '',
      },
      dispatch:    growlSuccess,
      rootGetters: {
        'management/byId':     (type, id) => ({ nameDisplay: id }),
        'type-map/optionsFor': type => ({ type }),
        'i18n/t':              (type, p) => p?.name ? type + p.name : type
      }
    };
    const data = {
      annotations: [],
      status:      {
        conditions: [{
          lastUpdateTime: new Date(),
          type:           'Completed'
        }]
      },
      clusterId: 'test',
      type:      'etcdBackup',
      state:     'active'
    };

    actions['ws.resource.change'](ctx, { data });

    expect(growlSuccess).toHaveBeenCalledWith('growl/success', {
      title:   'cluster.snapshot.success.title',
      message: 'cluster.snapshot.success.messagetest',
    }, { root: true });
  });

  it('should be rke growl fail when state failed', () => {
    const growlFail = jest.fn(t => t);
    const ctx = {
      getters: {
        normalizeType: type => type,
        typeEntry:     type => '',
      },
      dispatch:    growlFail,
      rootGetters: {
        'management/byId':     (type, id) => ({ nameDisplay: id }),
        'type-map/optionsFor': type => ({ type }),
        'i18n/t':              (type, p) => p?.name ? type + p.name : type
      }
    };
    const data = {
      annotations: [],
      status:      {
        conditions: [{
          lastUpdateTime: new Date(),
          type:           'Completed'
        }]
      },
      clusterId: 'testFail',
      type:      'etcdBackup',
      state:     'failed'
    };

    actions['ws.resource.change'](ctx, { data, type: 'rke.cattle.io.etcdsnapshot' });

    expect(growlFail).toHaveBeenCalledWith('growl/fromError', {
      title: 'cluster.snapshot.fail.title',
      err:   'cluster.snapshot.fail.messagetestFail',
    }, { root: true });
  });

  it('should be rke growl fail when state error', () => {
    const growlFail = jest.fn(t => t);
    const ctx = {
      getters: {
        normalizeType: type => type,
        typeEntry:     type => '',
      },
      dispatch:    growlFail,
      rootGetters: {
        'management/byId':     (type, id) => ({ nameDisplay: id }),
        'type-map/optionsFor': type => ({ type }),
        'i18n/t':              (type, p) => p?.name ? type + p.name : type
      }
    };
    const data = {
      annotations: [],
      status:      {
        conditions: [{
          lastUpdateTime: new Date(),
          type:           'Completed'
        }]
      },
      clusterId: 'testFail',
      type:      'etcdBackup',
      state:     'error'
    };

    actions['ws.resource.change'](ctx, { data, type: 'rke.cattle.io.etcdsnapshot' });

    expect(growlFail).toHaveBeenCalledWith('growl/fromError', {
      title: 'cluster.snapshot.fail.title',
      err:   'cluster.snapshot.fail.messagetestFail',
    }, { root: true });
  });
});
