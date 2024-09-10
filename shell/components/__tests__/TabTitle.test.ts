import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import TabTitle from '@shell/components/TabTitle.vue';
import * as privateLabel from '@shell/config/private-label';
import * as title from '@shell/utils/title';

describe('component: TabTitle', () => {
  function createMocks(): any {
    const mocks = {
      isExplorer:     false,
      isHarvester:    false,
      currentCluster: {
        nameDisplay: 'Cluster',
        isHarvester: false
      },
      currentProduct:      { name: 'Product' },
      withFallback:        null,
      vendor:              'Vendor',
      child:               'Child',
      updatePageTitleArgs: null
    };

    privateLabel.getVendor = () => mocks.vendor;
    title.updatePageTitle = (...args: any[]) => (mocks.updatePageTitleArgs = args);

    return mocks;
  }

  function mockStore(mocks: any) {
    return createStore({
      getters: {
        isExplorer() {
          return mocks.isExplorer;
        },
        currentCluster() {
          return mocks.currentCluster;
        },
        currentProduct() {
          return mocks.currentProduct;
        },
        'i18n/withFallback'() {
          return () => mocks.withFallback;
        }
      },
    });
  }

  it('should set a title including vendor, cluster and child(default slot) for explorer cluster', () => {
    const mocks = createMocks();

    mocks.isExplorer = true;
    const store = mockStore(mocks);

    shallowMount(TabTitle, {
      slots:  { default: mocks.child },
      global: { mocks: { $store: store } }
    });

    expect(mocks.updatePageTitleArgs).toStrictEqual([mocks.vendor, mocks.currentCluster.nameDisplay, mocks.child]);
  });

  it('should set a title including vendor, cluster and child(default slot) for harvester cluster', () => {
    const mocks = createMocks();

    mocks.currentCluster.isHarvester = true;
    const store = mockStore(mocks);

    shallowMount(TabTitle, {
      slots:  { default: mocks.child },
      global: { mocks: { $store: store } }
    });

    expect(mocks.updatePageTitleArgs).toStrictEqual([mocks.vendor, mocks.currentCluster.nameDisplay, mocks.child]);
  });

  it('should set a title including vendor and child(default slot) for product', () => {
    const mocks = createMocks();

    mocks.currentCluster = null;
    mocks.withFallback = 'product';
    const store = mockStore(mocks);

    shallowMount(TabTitle, {
      slots:  { default: mocks.child },
      global: { mocks: { $store: store } }
    });

    expect(mocks.updatePageTitleArgs).toStrictEqual([mocks.vendor, mocks.withFallback, mocks.child]);
  });

  it('should call console error when not passed a string as a child', () => {
    const mocks = createMocks();
    const store = mockStore(mocks);

    global.console = {
      warn:  jest.fn(),
      error: jest.fn()
    };

    shallowMount(TabTitle, {
      slots:  { default: jest.fn() },
      global: { mocks: { $store: store } }
    });

    expect(console.error).toHaveBeenCalledWith('The <TabTitle> component only supports text as the child.'); // eslint-disable-line no-console
  });

  it('should only show child', () => {
    const mocks = createMocks();
    const store = mockStore(mocks);

    shallowMount(TabTitle, {
      slots:  { default: mocks.child },
      props:  { breadcrumb: false },
      global: { mocks: { $store: store } }
    });

    expect(mocks.updatePageTitleArgs).toStrictEqual([mocks.child]);
  });

  it('should exclude vendor', () => {
    const mocks = createMocks();

    mocks.isExplorer = true;

    const store = mockStore(mocks);

    shallowMount(TabTitle, {
      slots:  { default: mocks.child },
      props:  { includeVendor: false },
      global: { mocks: { $store: store } }
    });

    expect(mocks.updatePageTitleArgs).toStrictEqual([mocks.currentCluster.nameDisplay, mocks.child]);
  });
});
