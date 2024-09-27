
const defaultStubs = {
  Tab:    { template: '<span><slot/></span>' },
  Tabbed: false,
};
const defaultGetters = {
  currentStore:           () => 'current_store',
  'management/schemaFor': jest.fn(),
  'current_store/all':    jest.fn(),
  'i18n/t':               jest.fn(),
  'i18n/withFallback':    jest.fn((key, args, fallback) => fallback),
};

const defaultMocks = { $store: { getters: defaultGetters }, $fetchState: { pending: false } };

export default {
  stubs:   defaultStubs,
  getters: defaultGetters,
  mocks:   defaultMocks,
};
