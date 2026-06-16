import { formatSubnetworkOptions } from '@shell/components/google/util/formatter';

describe('formatter', () => {
  const t = (key: string) => key;

  describe('formatSubnetworkOptions', () => {
    it('should format subnetwork options correctly', () => {
      const gkeSubnetworks = [
        {
          name:        'subnet-1',
          network:     'my-network',
          subnetwork:  'projects/project-1/regions/region-1/subnetworks/subnet-1',
          ipCidrRange: '10.0.0.0/24',
          selfLink:    'https://www.googleapis.com/compute/v1/projects/project-1/regions/region-1/subnetworks/subnet-1'
        },
        {
          network:     'my-network',
          subnetwork:  'projects/project-1/regions/region-1/subnetworks/subnet-2',
          ipCidrRange: '10.0.1.0/24',
          selfLink:    'https://www.googleapis.com/compute/v1/projects/project-1/regions/region-1/subnetworks/subnet-2'
        }
      ];

      const formattedOptions = formatSubnetworkOptions(t, 'my-network', gkeSubnetworks, {});

      expect(formattedOptions).toHaveLength(2);

      expect(formattedOptions[0]).toStrictEqual({
        name:        'projects/project-1/regions/region-1/subnetworks/subnet-1',
        label:       'subnet-1 (10.0.0.0/24)',
        network:     'my-network',
        subnetwork:  'projects/project-1/regions/region-1/subnetworks/subnet-1',
        ipCidrRange: '10.0.0.0/24',
        selfLink:    'https://www.googleapis.com/compute/v1/projects/project-1/regions/region-1/subnetworks/subnet-1'
      });

      expect(formattedOptions[1]).toStrictEqual({
        name:        'projects/project-1/regions/region-1/subnetworks/subnet-2',
        label:       'subnet-2 (10.0.1.0/24)',
        network:     'my-network',
        subnetwork:  'projects/project-1/regions/region-1/subnetworks/subnet-2',
        ipCidrRange: '10.0.1.0/24',
        selfLink:    'https://www.googleapis.com/compute/v1/projects/project-1/regions/region-1/subnetworks/subnet-2'
      });
    });
  });
});
