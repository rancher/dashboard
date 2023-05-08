import globalMonitoring from '@shell/pages/c/_cluster/manager/globalMonitoring/index.vue';
import { set } from '@shell/utils/object';

function delay(t, v) {
  return new Promise((resolve) => {
    setTimeout(resolve.bind(null, v), t);
  });
}
const $store = {
  getters: {
    'management/byId': (type, id) => {
      if (type === 'cluster' || type === 'management.cattle.io.cluster') {
        return {
          metadata:        { state: { name: 'active' } },
          nameDisplay:     'local',
          availableCpu:    '',
          availableMemory: '',
          id:              'local',
        };
      }
    },
    'i18n/t':       (type, p) => p?.name ? type + p.name : type,
    'catalog/repo': ({ repoType, repoName }) => ({
      doAction:         t => t,
      waitForOperation: t => t,
    }),
    'catalog/charts': [{}],
  },
  dispatch: (key) => {
    const store = {
      // 'catalog/getVersionInfo': JSON.parse(versionInfo),
      'management/find': (key, a) => {
        return key;
      }
    };

    return store[key];
  },
  rootGetters: {
    'management/byId':     (type, id) => ({ nameDisplay: id }),
    'type-map/optionsFor': type => ({ type }),
    'i18n/t':              (type, p) => p?.name ? type + p.name : type
  }
};

const $route = { params: { cluster: 'test' } };
const $router = { replace: jest.fn() };

describe('global monitorning methods', () => {
  it('methods initGlobalMonitoringRoute jump to page ', async() => {
    const localThis = {
      t:                t => t,
      monitoringStatus: { installed: true },
      $set:             set,
      $store,
      $route,
      $router,
      query:            { stores: [] }
    };

    globalMonitoring.methods.initGlobalMonitoringRoute.call(localThis);

    await delay(1500);

    expect(localThis.$router.replace).toBeCalledTimes(1);
  });
});
