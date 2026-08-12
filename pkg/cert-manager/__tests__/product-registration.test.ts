import { IExtension, IPlugin } from '@shell/core/types';
import { ExtendingPluginProduct } from '@shell/core/plugin-products-extending';
import { ProductChild } from '@shell/core/plugin-products-external';
import { CERT_MANAGER } from '../types';

jest.doMock('@rancher/auto-import', () => ({ importTypes: jest.fn() }), { virtual: true });

jest.mock('@shell/core/productDebugger', () => ({
  DSLRegistrationsPerProduct: jest.fn(),
  registeredRoutes:           jest.fn(),
}));

const GROUP = 'explorer-cert-manager';
const ACME_GROUP = `${ GROUP }-cert-manager-acme`;
const OVERVIEW = `${ GROUP }-cert-manager-overview`;

function createMockDSL() {
  return {
    product:             jest.fn(),
    basicType:           jest.fn(),
    labelGroup:          jest.fn(),
    setGroupDefaultType: jest.fn(),
    weightGroup:         jest.fn(),
    virtualType:         jest.fn(),
    configureType:       jest.fn(),
    weightType:          jest.fn(),
    mapType:             jest.fn(),
    ignoreType:          jest.fn(),
    hideBulkActions:     jest.fn(),
    headers:             jest.fn(),
  };
}

/**
 * Run the extension's real config through the real ExtendingPluginProduct, so this asserts what
 * the type-map actually receives rather than just the shape of the config object.
 */
async function applyExtension() {
  const extension = await import('../index');
  const dsl = createMockDSL();
  const plugin = {
    extendProduct:              jest.fn(),
    addRoute:                   jest.fn(),
    enableServerSidePagination: jest.fn(),
    DSL:                        jest.fn().mockReturnValue(dsl),
    register:                   jest.fn(),
    metadata:                   {},
  } as any as IPlugin & IExtension;

  extension.default(plugin);

  const config = (plugin.extendProduct as jest.Mock).mock.calls[0][1] as ProductChild[];
  const store = { getters: { 'type-map/productByName': () => ({ name: 'explorer', extendable: true }) } };
  const product = new ExtendingPluginProduct(plugin, 'explorer', config);

  product.apply(plugin, store);

  return { dsl, plugin };
}

describe('extension: cert-manager product registration', () => {
  it('should not re-register the explorer product', async() => {
    const { dsl } = await applyExtension();

    expect(dsl.product).not.toHaveBeenCalled();
  });

  it('should register the group children under the cert-manager group', async() => {
    const { dsl } = await applyExtension();
    const call = dsl.basicType.mock.calls.find(([, group]) => group === GROUP);

    expect(call?.[0]).toStrictEqual([
      OVERVIEW,
      CERT_MANAGER.CERTIFICATE,
      CERT_MANAGER.ISSUER,
      CERT_MANAGER.CLUSTER_ISSUER,
      ACME_GROUP,
      GROUP,
    ]);
  });

  it('should register the ACME children under the nested group path', async() => {
    const { dsl } = await applyExtension();
    const call = dsl.basicType.mock.calls.find(([, group]) => group === `${ GROUP }::${ ACME_GROUP }`);

    expect(call?.[0]).toStrictEqual([
      CERT_MANAGER.CERTIFICATE_REQUEST,
      CERT_MANAGER.ORDER,
      CERT_MANAGER.CHALLENGE,
    ]);
  });

  it('should weight and label both groups', async() => {
    const { dsl } = await applyExtension();

    expect(dsl.weightGroup).toHaveBeenCalledWith(GROUP, 93, true);
    expect(dsl.weightGroup).toHaveBeenCalledWith(ACME_GROUP, 10, true);
    expect(dsl.labelGroup).toHaveBeenCalledWith(GROUP, undefined, 'certManager.nav.group.certManager');
    expect(dsl.labelGroup).toHaveBeenCalledWith(ACME_GROUP, undefined, 'certManager.nav.group.acme');
  });

  it('should land on the overview page when the group header is clicked', async() => {
    const { dsl } = await applyExtension();

    expect(dsl.setGroupDefaultType).toHaveBeenCalledWith(GROUP, OVERVIEW);
  });

  it('should configure all six resource types', async() => {
    const { dsl } = await applyExtension();
    const configured = dsl.configureType.mock.calls.map(([type]) => type);

    expect(configured).toStrictEqual(Object.values(CERT_MANAGER));
  });

  it('should register client-side list columns for all six types', async() => {
    const { dsl } = await applyExtension();

    // `headers(type, localHeaders, paginationHeaders)` - these CRDs are not registered for
    // server-side pagination, so only the local (second argument) columns are supplied.
    expect(dsl.headers.mock.calls.map(([type]) => type)).toStrictEqual(Object.values(CERT_MANAGER));

    dsl.headers.mock.calls.forEach(([, localHeaders, paginationHeaders]) => {
      expect(localHeaders.length).toBeGreaterThan(0);
      expect(paginationHeaders).toBeUndefined();
    });
  });

  it('should register the overview page as a gated virtual type', async() => {
    const { dsl } = await applyExtension();
    const [config] = dsl.virtualType.mock.calls.find(([c]) => c.name === OVERVIEW) || [];

    expect(config.labelKey).toBe('certManager.nav.overview');
    expect(config.ifHaveType).toBe(CERT_MANAGER.CERTIFICATE);
  });
});
