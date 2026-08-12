import day from 'dayjs';
import { shallowMount } from '@vue/test-utils';
import Overview from '../../pages/Overview.vue';
import { CERT_MANAGER } from '../../types';

jest.mock('@shell/utils/auth', () => ({ checkSchemasForFindAllHash: jest.fn(() => Promise.resolve({})) }));

const iso = (offsetDays: number) => day().add(offsetDays, 'day').toISOString();

const cert = (name: string, state: string, expiresAt?: string, stateDescription = '') => ({
  id: `default/${ name }`, type: CERT_MANAGER.CERTIFICATE, metadata: { name, namespace: 'default' }, nameDisplay: name, state, expiresAt, stateDescription
});

async function render(data: Record<string, any> = {}) {
  const wrapper = shallowMount(Overview, {
    global: {
      mocks: {
        t:           (key: string) => key,
        $store:      { getters: { 'type-map/labelFor': () => 'Label' } },
        $route:      { params: { cluster: 'local' } },
        $fetchState: { pending: false },
      },
    },
  });

  await wrapper.setData({
    certificates: [], issuers: [], clusterIssuers: [], orders: [], challenges: [], apps: [], ...data
  });

  return wrapper;
}

describe('page: cert-manager Overview', () => {
  describe('install banner', () => {
    it('should report the installed chart version', async() => {
      const apps = [{ spec: { chart: { metadata: { name: 'cert-manager', version: 'v1.20.0' } } } }];

      expect((await render({ apps })).vm.installedVersion).toBe('v1.20.0');
    });

    it('should stay quiet when cert-manager was not installed by Helm', async() => {
      const apps = [{ spec: { chart: { metadata: { name: 'rancher-monitoring', version: 'v1.0.0' } } } }];

      expect((await render({ apps })).vm.installedVersion).toBeUndefined();
    });
  });

  describe('counts', () => {
    it('should count each resource type', async() => {
      const wrapper = await render({
        certificates:   [cert('a', 'active'), cert('b', 'active')],
        issuers:        [{ id: '1' }],
        clusterIssuers: [{ id: '2' }, { id: '3' }, { id: '4' }],
      });

      // certificates, issuers, cluster issuers, pending orders
      expect(wrapper.vm.counts.map((c: any) => c.count)).toStrictEqual([2, 1, 3, 0]);
    });

    it('should only count orders that are still working', async() => {
      const orders = [
        { id: '1', state: 'pending' },
        { id: '2', state: 'in-progress' },
        { id: '3', state: 'active' },
        { id: '4', state: 'error' },
      ];

      expect((await render({ orders })).vm.counts[3].count).toBe(2);
    });
  });

  describe('health', () => {
    it('should bucket certificates by state and drop empty buckets', async() => {
      const certificates = [
        cert('a', 'active'), cert('b', 'active'), cert('c', 'expired'), cert('d', 'error'),
      ];

      expect((await render({ certificates })).vm.health).toStrictEqual([
        { state: 'active', count: 2 },
        { state: 'expired', count: 1 },
        { state: 'error', count: 1 },
      ]);
    });

    it('should ignore states it does not track', async() => {
      expect((await render({ certificates: [cert('a', 'unknown')] })).vm.health).toStrictEqual([]);
    });
  });

  describe('expiring soon', () => {
    it('should list only certificates expiring within 30 days, soonest first', async() => {
      const certificates = [
        cert('far', 'active', iso(200)),
        cert('soon', 'expiring', iso(5)),
        cert('sooner', 'expiring', iso(1)),
        cert('never', 'active', undefined),
      ];

      expect((await render({ certificates })).vm.expiringSoon.map((c: any) => c.metadata.name)).toStrictEqual(['sooner', 'soon']);
    });

    it('should include already expired certificates', async() => {
      const certificates = [cert('gone', 'expired', iso(-2))];

      expect((await render({ certificates })).vm.expiringSoon).toHaveLength(1);
    });

    it('should cap the list at ten', async() => {
      const certificates = Array.from({ length: 25 }, (_, i) => cert(`cert-${ i }`, 'expiring', iso(i % 20)));

      expect((await render({ certificates })).vm.expiringSoon).toHaveLength(10);
    });
  });

  describe('needs attention', () => {
    it('should collect failing certificates, orders and stuck challenges', async() => {
      const wrapper = await render({
        certificates: [cert('bad', 'error', iso(100), 'issuer not found'), cert('good', 'active', iso(100))],
        orders:       [{
          id: 'o1', state: 'error', stateDescription: 'rate limited', metadata: {}
        }],
        challenges: [{
          id: 'c1', state: 'pending', status: { reason: 'waiting for propagation' }, metadata: {}
        }],
      });

      expect(wrapper.vm.problems.map((p: any) => p.reason)).toStrictEqual([
        'issuer not found',
        'rate limited',
        'waiting for propagation',
      ]);
    });

    it('should ignore a challenge that succeeded even if it reported a reason on the way', async() => {
      const challenges = [{
        id: 'c1', state: 'active', status: { reason: 'presented' }, metadata: {}
      }];

      expect((await render({ challenges })).vm.problems).toStrictEqual([]);
    });

    it('should be empty when everything is healthy', async() => {
      expect((await render({ certificates: [cert('a', 'active', iso(100))] })).vm.problems).toStrictEqual([]);
    });
  });
});
