import NetworkPolicy from '@shell/models/networking.k8s.io.networkpolicy';
import { workloadsInNamespace } from '@shell/utils/related-resources';

jest.mock('@shell/utils/related-resources', () => ({
  ...jest.requireActual('@shell/utils/related-resources'),
  workloadsInNamespace: jest.fn(),
}));

const mockedWorkloadsInNamespace = workloadsInNamespace as jest.Mock;

// a workload whose pods the policy's `podSelector` selects when `selected`
const workload = (name: string, selected: boolean) => ({
  metadata: { name, namespace: 'ns' }, typeDisplay: 'Deployment', hasPodsSelectedBy: () => selected
});

describe('class NetworkPolicy', () => {
  describe('fetchModelRelatedResources', () => {
    const policy = () => new NetworkPolicy({
      metadata: {
        name: 'allow-http', namespace: 'ns', uid: 'uid'
      },
      spec: { podSelector: { matchLabels: { app: 'web' } } }
    });

    beforeEach(() => {
      mockedWorkloadsInNamespace.mockReset();
    });

    // a dependent is not expanded, so the tree does not take in the resources each workload uses
    it('should return the workloads it selects as dependents', async() => {
      const selected = workload('web', true);

      mockedWorkloadsInNamespace.mockResolvedValue([selected, workload('other', false)]);

      expect(await policy().fetchModelRelatedResources({ dependencies: true, dependents: true })).toStrictEqual([
        {
          resource: selected, group: 'Deployment', dependent: true
        }
      ]);
    });

    it('should make no requests when only dependencies are wanted', async() => {
      expect(await policy().fetchModelRelatedResources({ dependencies: true, dependents: false })).toStrictEqual([]);
      expect(mockedWorkloadsInNamespace).toHaveBeenCalledTimes(0);
    });

    it('should make no requests for a policy that is not created yet', async() => {
      const neu = new NetworkPolicy({ metadata: { name: 'new', namespace: 'ns' }, spec: {} });

      expect(await neu.fetchModelRelatedResources({ dependencies: true, dependents: true })).toStrictEqual([]);
      expect(mockedWorkloadsInNamespace).toHaveBeenCalledTimes(0);
    });
  });
});
