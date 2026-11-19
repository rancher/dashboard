import { init } from '@shell/config/product/explorer';
import { NODE as NODE_COL } from '@shell/config/table-headers';
import { mount, RouterLinkStub } from '@vue/test-utils';
import Link from '@shell/components/formatter/Link.vue';
import { CRD, FLEET, HELM, POD } from '@shell/config/types';
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
