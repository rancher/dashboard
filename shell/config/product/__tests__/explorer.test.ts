import { init } from '@shell/config/product/explorer';
import {
  AGE as AGE_COL, NAMESPACE as NAMESPACE_COL, NODE as NODE_COL, PERSISTENT_VOLUME as PERSISTENT_VOLUME_COL, STATE as STATE_COL
} from '@shell/config/table-headers';
import { createHeaders } from '@shell/store/type-map.utils';
import { mount, RouterLinkStub } from '@vue/test-utils';
import Link from '@shell/components/formatter/Link.vue';
import LinkName from '@shell/components/formatter/LinkName.vue';
import {
  CRD, FLEET, HELM, POD, PV, PVC
} from '@shell/config/types';
import { get } from '@shell/utils/object';
import { fieldValue, stringifyValue } from '@shell/utils/table-views/fields';
import type { TableViewRow } from '@shell/types/table-views';

interface CrdRow extends TableViewRow {
  resourceType: string;
  resourceLink: { text: string, to: { name: string, params: Record<string, string> } };
}

describe('product: explorer', () => {
  const initExplorer = () => {
    const commit = jest.fn();

    init({ commit, getters: { 'i18n/t': (key: string) => key } });

    return commit;
  };

  const nodeColumn = (commit: jest.Mock, mutation: string) => commit.mock.calls
    .find(([name, value]) => name === `type-map/${ mutation }` && value.type === POD)?.[1][mutation]
    .find((header: any) => header.name === NODE_COL.name);

  const crdResourceColumn = (commit: jest.Mock, mutation: string) => commit.mock.calls
    .find(([name, value]) => name === `type-map/${ mutation }` && value.type === CRD)?.[1][mutation]
    .find((header: any) => header.name === 'crd-cr');

  it.each([
    ['list', 'headers'],
    ['paginated list', 'paginationHeaders'],
  ])('should show the node in the pods %s as a link, like the node column of other lists', (_, mutation) => {
    const commit = initExplorer();
    const {
      name, labelKey, sort, formatter, formatterOpts, skipSelect
    } = nodeColumn(commit, mutation);

    expect({
      name, labelKey, sort, formatter, formatterOpts, skipSelect
    }).toStrictEqual({
      name: NODE_COL.name, labelKey: NODE_COL.labelKey, sort: NODE_COL.sort, formatter: 'LinkName', formatterOpts: NODE_COL.formatterOpts, skipSelect: undefined
    });
  });

  describe.each([
    ['list', 'headers', ['spec.volumeName']],
    ['paginated list', 'paginationHeaders', ['metadata.fields.2']],
  ])('persistent volume claims %s', (_, mutation, sortFields) => {
    const pvcHeaders = (commit: jest.Mock) => commit.mock.calls
      .find(([name, value]) => name === `type-map/${ mutation }` && value.type === PVC)?.[1][mutation];

    const volumeColumn = (commit: jest.Mock) => pvcHeaders(commit).find((header: any) => header.name === PERSISTENT_VOLUME_COL.name);

    const mountVolumeCell = (header: any, row: any, canViewPV = true) => mount(LinkName, {
      props:  { value: get(row, header.value), ...header.formatterOpts },
      global: {
        stubs: { 'router-link': RouterLinkStub },
        mocks: {
          $store: {
            getters: {
              clusterId:            'local',
              productId:            'explorer',
              currentStore:         () => 'cluster',
              'cluster/schemaFor':  (type: string) => (type === PV && canViewPV ? {} : undefined),
              'type-map/isVirtual': () => false,
            }
          }
        }
      }
    });

    it('should keep the kubectl columns, taking the plain ones from the schema', () => {
      const names = pvcHeaders(initExplorer()).map((header: any) => (typeof header === 'string' ? header : header.name));

      expect(names).toStrictEqual(['state', 'name', 'namespace', 'Status', 'volume', 'Capacity', 'Access Modes', 'StorageClass', 'VolumeAttributesClass', 'VolumeMode', 'age']);
    });

    it('should sort the volume column by the bound volume name', () => {
      expect(volumeColumn(initExplorer()).sort).toStrictEqual(sortFields);
    });

    it('should take the plain columns from the schema and drop the ones the cluster does not provide', () => {
      const schemaColumns = ['Name', 'Status', 'Volume', 'Capacity', 'Access Modes', 'StorageClass', 'Age'].map((name, i) => ({
        name, field: `$.metadata.fields[${ i }]`, type: 'string', format: name === 'Name' ? 'name' : ''
      }));
      const headers = createHeaders({ rootGetters: { 'i18n/exists': () => false, 'i18n/t': (key: string) => key } } as any, {
        headers:     { [PVC]: pvcHeaders(initExplorer()) },
        typeOptions: {},
        schema:      { id: PVC, attributes: { columns: schemaColumns } },
        columns:     {
          state: STATE_COL, namespace: NAMESPACE_COL, age: AGE_COL
        },
        pagination: mutation === 'paginationHeaders',
      });

      expect(headers.map((header: any) => header.label || header.name)).toStrictEqual(['state', 'name', 'namespace', 'Status', 'volume', 'Capacity', 'Access Modes', 'StorageClass', 'age']);
    });

    it('should link the volume column to the bound persistent volume', () => {
      const wrapper = mountVolumeCell(volumeColumn(initExplorer()), { spec: { volumeName: 'pvc-1234' } });

      expect(wrapper.text()).toStrictEqual('pvc-1234');
      expect(wrapper.findComponent(RouterLinkStub).props().to).toStrictEqual({
        name:   'c-cluster-product-resource-id',
        params: {
          cluster: 'local', product: 'explorer', resource: PV, id: 'pvc-1234'
        }
      });
    });

    it('should show the volume name without a link if the user cannot view persistent volumes', () => {
      const wrapper = mountVolumeCell(volumeColumn(initExplorer()), { spec: { volumeName: 'pvc-1234' } }, false);

      expect(wrapper.text()).toStrictEqual('pvc-1234');
      expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
    });

    it('should show nothing for a pending claim without a volume', () => {
      const wrapper = mountVolumeCell(volumeColumn(initExplorer()), { spec: {} });

      expect(wrapper.text()).toStrictEqual('');
    });
  });

  it.each([
    FLEET.GIT_REPO,
    FLEET.HELM_OP,
    HELM.PROJECTHELMCHART,
  ])('should hide the default masthead of the %s list, which renders its own', (type) => {
    const commit = initExplorer();
    const options = commit.mock.calls
      .filter(([name, value]) => name === 'type-map/configureType' && value.match === type)
      .map(([, value]) => value);

    expect(options).toStrictEqual([{
      showListMasthead: false, match: type, product: 'explorer'
    }]);
  });

  describe.each([
    ['list', 'headers'],
    ['paginated list', 'paginationHeaders'],
  ])('custom resource definitions %s', (_, mutation) => {
    it('should sort the resource column by group then singular name', () => {
      const commit = initExplorer();

      expect(crdResourceColumn(commit, mutation).sort).toStrictEqual(['spec.group', 'spec.names.singular']);
    });

    it('should search the resource column by group and singular name', () => {
      const commit = initExplorer();

      expect(crdResourceColumn(commit, mutation).search).toStrictEqual(['spec.group', 'spec.names.singular']);
    });

    const row: CrdRow = {
      resourceType: 'auditlog.cattle.io.auditpolicy',
      resourceLink: {
        text: 'auditlog.cattle.io.auditpolicy (3)',
        to:   {
          name:   'c-cluster-product-resource',
          params: {
            cluster: 'local', product: 'explorer', resource: 'auditlog.cattle.io.auditpolicy'
          }
        }
      }
    };

    const mountResourceCell = (header: any) => mount(Link, {
      props: {
        row, value: get(row, header.value), ...header.formatterOpts
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    it('should group the resource column by resource type, without the count', () => {
      const commit = initExplorer();
      const header = crdResourceColumn(commit, mutation);

      expect(stringifyValue(fieldValue(row, {
        id: header.name, label: 'Resource', isLabel: false, header
      }))).toStrictEqual('auditlog.cattle.io.auditpolicy');
    });

    it('should show the resource type and its count in the resource column', () => {
      const wrapper = mountResourceCell(crdResourceColumn(initExplorer(), mutation));

      expect(wrapper.text()).toStrictEqual('auditlog.cattle.io.auditpolicy (3)');
    });

    it('should link the resource column to the list of its custom resources', () => {
      const wrapper = mountResourceCell(crdResourceColumn(initExplorer(), mutation));

      expect(wrapper.findComponent(RouterLinkStub).props().to).toStrictEqual(row.resourceLink.to);
    });
  });
});
