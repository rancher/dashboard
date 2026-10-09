import Service from '@shell/models/service';
import { findAllOf, workloadsInNamespace } from '@shell/utils/related-resources';

jest.mock('@shell/utils/related-resources', () => ({
  ...jest.requireActual('@shell/utils/related-resources'),
  findAllOf:            jest.fn(),
  workloadsInNamespace: jest.fn(),
}));

const mockedFindAllOf = findAllOf as jest.Mock;
const mockedWorkloadsInNamespace = workloadsInNamespace as jest.Mock;

// a workload whose pods the Service sends traffic to when `selected`
const workload = (name: string, selected: boolean) => ({
  metadata: { name, namespace: 'ns' }, typeDisplay: 'Deployment', isSelectedByService: () => selected
});

describe('class Service', () => {
  describe('fetchModelRelatedResources', () => {
    const service = () => new Service({
      metadata: {
        name: 'web', namespace: 'ns', uid: 'uid'
      },
      spec: { selector: { app: 'web' } }
    });

    beforeEach(() => {
      mockedFindAllOf.mockReset();
      mockedFindAllOf.mockResolvedValue([]);
      mockedWorkloadsInNamespace.mockReset();
    });

    // a dependent is not expanded, so the tree does not take in the resources each workload uses
    it('should return the workloads it sends traffic to as dependents', async() => {
      const selected = workload('web', true);

      mockedWorkloadsInNamespace.mockResolvedValue([selected]);

      expect(await service().fetchModelRelatedResources({ dependencies: true, dependents: true })).toStrictEqual([
        {
          resource: selected, group: 'Deployment', dependent: true
        }
      ]);
    });

    it('should leave out the workloads it does not send traffic to', async() => {
      mockedWorkloadsInNamespace.mockResolvedValue([workload('other', false)]);

      expect(await service().fetchModelRelatedResources({ dependencies: true, dependents: true })).toStrictEqual([]);
    });

    it('should make no requests when only dependencies are wanted', async() => {
      expect(await service().fetchModelRelatedResources({ dependencies: true, dependents: false })).toStrictEqual([]);
      expect(mockedWorkloadsInNamespace).toHaveBeenCalledTimes(0);
      expect(mockedFindAllOf).toHaveBeenCalledTimes(0);
    });
  });
});
