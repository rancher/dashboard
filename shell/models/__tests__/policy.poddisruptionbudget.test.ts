import PodDisruptionBudget from '@shell/models/policy.poddisruptionbudget';
import { workloadsInNamespace } from '@shell/utils/related-resources';

jest.mock('@shell/utils/related-resources', () => ({
  ...jest.requireActual('@shell/utils/related-resources'),
  workloadsInNamespace: jest.fn(),
}));

const mockedWorkloadsInNamespace = workloadsInNamespace as jest.Mock;

// a workload whose pods the budget's `selector` selects when `selected`
const workload = (name: string, selected: boolean) => ({
  metadata: { name, namespace: 'ns' }, typeDisplay: 'Deployment', hasPodsSelectedBy: () => selected
});

describe('class PodDisruptionBudget', () => {
  describe('fetchModelRelatedResources', () => {
    const budget = () => new PodDisruptionBudget({
      metadata: {
        name: 'web', namespace: 'ns', uid: 'uid'
      },
      spec: { selector: { matchLabels: { app: 'web' } } }
    });

    beforeEach(() => {
      mockedWorkloadsInNamespace.mockReset();
    });

    // a dependent is not expanded, so the tree does not take in the resources each workload uses
    it('should return the workloads it selects as dependents', async() => {
      const selected = workload('web', true);

      mockedWorkloadsInNamespace.mockResolvedValue([selected, workload('other', false)]);

      expect(await budget().fetchModelRelatedResources({ dependencies: true, dependents: true })).toStrictEqual([
        {
          resource: selected, group: 'Deployment', dependent: true
        }
      ]);
    });

    it('should make no requests when only dependencies are wanted', async() => {
      expect(await budget().fetchModelRelatedResources({ dependencies: true, dependents: false })).toStrictEqual([]);
      expect(mockedWorkloadsInNamespace).toHaveBeenCalledTimes(0);
    });
  });
});
