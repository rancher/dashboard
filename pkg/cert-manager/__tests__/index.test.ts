import { IPlugin } from '@shell/core/types';
import { ProductChildGroup, ProductChildResourcePage } from '@shell/core/plugin-products-external';
import { CERT_MANAGER } from '../types';

jest.doMock('@rancher/auto-import', () => ({ importTypes: jest.fn() }), { virtual: true });

function createMockPlugin(): IPlugin {
  return {
    extendProduct:              jest.fn(),
    addProduct:                 jest.fn(),
    addRoutes:                  jest.fn(),
    enableServerSidePagination: jest.fn(),
    register:                   jest.fn(),
    metadata:                   {},
  } as any as IPlugin;
}

async function registerExtension() {
  const plugin = await import('../index');
  const mock = createMockPlugin();

  plugin.default(mock);

  const [productName, config] = (mock.extendProduct as jest.Mock).mock.calls[0];

  return {
    mock, productName, group: config[0] as ProductChildGroup
  };
}

describe('extension: cert-manager', () => {
  it('should extend the explorer product with a single group', async() => {
    const { mock, productName, group } = await registerExtension();

    expect(mock.extendProduct).toHaveBeenCalledWith('explorer', [group]);
    expect(productName).toBe('explorer');
    expect(group.name).toBe('cert-manager');
    expect(group.labelKey).toBe('certManager.nav.group.certManager');
  });

  it('should weight the group below the built-in explorer groups', async() => {
    const { group } = await registerExtension();

    // explorer.js weights: cluster 99, workload 98, serviceDiscovery 96, storage 95, policy 94
    expect(group.sideMenu.weight).toBe(93);
  });

  it('should list the overview page and the three top level resources, plus a nested Advanced group', async() => {
    const { group } = await registerExtension();
    const children = group.sideMenu.children;

    expect(children).toHaveLength(5);
    expect((children[0] as any).name).toBe('cert-manager-overview');
    expect((children[1] as any).type).toBe(CERT_MANAGER.CERTIFICATE);
    expect((children[2] as any).type).toBe(CERT_MANAGER.ISSUER);
    expect((children[3] as any).type).toBe(CERT_MANAGER.CLUSTER_ISSUER);

    const acme = children[4] as ProductChildGroup;

    expect(acme.name).toBe('cert-manager-advanced');
    expect(acme.labelKey).toBe('certManager.nav.group.advanced');
    expect(acme.sideMenu.children.map((c) => (c as any).type)).toStrictEqual([
      CERT_MANAGER.CERTIFICATE_REQUEST,
      CERT_MANAGER.ORDER,
      CERT_MANAGER.CHALLENGE,
    ]);
  });

  it('should nest groups no more than two deep', async() => {
    const { group } = await registerExtension();

    // `_ensureGroup` splits the group path with `split('::', 2)`, so a third level is silently
    // truncated and its entries land in the wrong place.
    const acme = group.sideMenu.children[4] as ProductChildGroup;

    acme.sideMenu.children.forEach((child) => {
      expect((child as any).sideMenu?.children).toBeUndefined();
    });
  });

  it('should gate the overview page on cert-manager being installed', async() => {
    const { group } = await registerExtension();
    const overview = group.sideMenu.children[0] as any;

    // Resource pages drop out on their own when the CRD has no schema, but a virtual type
    // renders regardless - without this gate the group would show for every cluster.
    expect(overview.enable).toStrictEqual({ ifHaveType: CERT_MANAGER.CERTIFICATE });
  });

  it('should not set `can` on any resource page', async() => {
    const { group } = await registerExtension();
    const acme = group.sideMenu.children[4] as ProductChildGroup;
    const resourcePages = [
      ...group.sideMenu.children.slice(1, 4),
      ...acme.sideMenu.children,
    ] as ProductChildResourcePage[];

    // `plugin-products-base` derives `isRemovable` from `can.create`, so a `can` block silently
    // disables delete. Leave it unset until that is fixed.
    resourcePages.forEach((page) => expect(page.can).toBeUndefined());
  });
});
