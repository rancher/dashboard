import { containerImages } from '@shell/utils/validators/container-images';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/container-images', () => {
  describe('containerImages', () => {
    it('adds required error when containers array is empty (regular workload)', () => {
      const errors: string[] = [];
      const spec = { template: { spec: { containers: [] } } };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual(['validation.required:{"key":"workload.container.titles.containers"}']);
    });

    it('adds required error when containers is missing (regular workload)', () => {
      const errors: string[] = [];
      const spec = { template: { spec: {} } };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual(['validation.required:{"key":"workload.container.titles.containers"}']);
    });

    it('adds no errors when all containers have images (regular workload)', () => {
      const errors: string[] = [];
      const spec = {
        template: {
          spec: {
            containers: [
              { name: 'web', image: 'nginx:latest' },
              { name: 'sidecar', image: 'busybox:1.36' },
            ],
          },
        },
      };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual([]);
    });

    it('adds image error for each container missing an image (regular workload)', () => {
      const errors: string[] = [];
      const spec = {
        template: {
          spec: {
            containers: [
              { name: 'web' },
              { name: 'sidecar', image: 'busybox' },
              { name: 'proxy' },
            ],
          },
        },
      };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual([
        'workload.validation.containerImage:{"name":"web"}',
        'workload.validation.containerImage:{"name":"proxy"}',
      ]);
    });

    it('adds required error when containers array is empty (cronjob)', () => {
      const errors: string[] = [];
      const spec = { jobTemplate: { spec: { template: { spec: { containers: [] } } } } };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual(['validation.required:{"key":"workload.container.titles.containers"}']);
    });

    it('adds no errors when all containers have images (cronjob)', () => {
      const errors: string[] = [];
      const spec = { jobTemplate: { spec: { template: { spec: { containers: [{ name: 'job', image: 'alpine:3' }] } } } } };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual([]);
    });

    it('adds image error for container missing image (cronjob)', () => {
      const errors: string[] = [];
      const spec = { jobTemplate: { spec: { template: { spec: { containers: [{ name: 'batch' }] } } } } };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual(['workload.validation.containerImage:{"name":"batch"}']);
    });

    it('does not add error when container is null-like in the array', () => {
      const errors: string[] = [];
      const spec = { template: { spec: { containers: [null] } } };

      containerImages(spec, mockGetters, errors);

      expect(errors).toStrictEqual([]);
    });
  });
});
