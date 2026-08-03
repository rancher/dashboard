import {
  importCloudCredential,
  importMachineConfig,
  importLogin,
  importChart,
  importList,
  importDetail,
  importEdit,
  importDialog,
  importDrawer,
  importWindowComponent,
  loadProduct,
  loadTranslation,
} from '@shell/utils/dynamic-importer';
import { defineAsyncComponent } from 'vue';

jest.mock('vue', () => ({ defineAsyncComponent: jest.fn(() => 'mockAsyncComponent') }));

const ASYNC_COMPONENT_IMPORTERS = [
  {
    desc: 'importCloudCredential',
    fn:   importCloudCredential,
  },
  {
    desc: 'importMachineConfig',
    fn:   importMachineConfig,
  },
  {
    desc: 'importLogin',
    fn:   importLogin,
  },
  {
    desc: 'importChart',
    fn:   importChart,
  },
  {
    desc: 'importList',
    fn:   importList,
  },
  {
    desc: 'importDetail',
    fn:   importDetail,
  },
  {
    desc: 'importEdit',
    fn:   importEdit,
  },
  {
    desc: 'importDialog',
    fn:   importDialog,
  },
  {
    desc: 'importDrawer',
    fn:   importDrawer,
  },
  {
    desc: 'importWindowComponent',
    fn:   importWindowComponent,
  },
];

const DIRECT_IMPORTERS = [
  {
    desc: 'loadProduct',
    fn:   loadProduct,
  },
  {
    desc: 'loadTranslation',
    fn:   loadTranslation,
  },
];

const ALL_GUARDED_IMPORTERS = [...ASYNC_COMPONENT_IMPORTERS, ...DIRECT_IMPORTERS];

describe('dynamic-importer', () => {
  describe('name guard — throws when name is falsy', () => {
    it.each(ALL_GUARDED_IMPORTERS)('$desc throws for null', ({ fn }) => {
      expect(() => fn(null as any)).toThrow('Name required');
    });

    it.each(ALL_GUARDED_IMPORTERS)('$desc throws for undefined', ({ fn }) => {
      expect(() => fn(undefined as any)).toThrow('Name required');
    });

    it.each(ALL_GUARDED_IMPORTERS)('$desc throws for empty string', ({ fn }) => {
      expect(() => fn('')).toThrow('Name required');
    });
  });

  describe('async component importers — delegates to defineAsyncComponent', () => {
    beforeEach(() => {
      (defineAsyncComponent as jest.Mock).mockClear();
    });

    it.each(ASYNC_COMPONENT_IMPORTERS)('$desc calls defineAsyncComponent with a loader function', ({ fn }) => {
      const result = fn('some-name');

      expect(defineAsyncComponent).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toStrictEqual('mockAsyncComponent');
    });
  });
});
