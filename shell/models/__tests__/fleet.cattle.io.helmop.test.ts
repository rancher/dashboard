import HelmOp from '@shell/models/fleet.cattle.io.helmop.js';

describe('class HelmOp', () => {
  let instance;

  describe('source getter', () => {
    it('should return correct source for SOURCE_TYPE.REPO (HTTPS)', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            repo:  'https://charts.rancher.io/fleet',
            chart: 'fleet-agent'
          }
        }
      });

      const source = instance.source;

      expect(source.value).toBe('https://charts.rancher.io/fleet');
      expect(source.display).toBe('charts.rancher.io/fleet');
      expect(source.icon).toBe('icon icon-application');
      expect(source.showLink).toBe(true);
    });

    it('should return correct source for SOURCE_TYPE.REPO (GitHub HTTPS .git)', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            repo:  'https://github.com/rancher/fleet.git',
            chart: 'fleet'
          }
        }
      });

      const source = instance.source;

      expect(source.value).toBe('https://github.com/rancher/fleet.git');
      expect(source.display).toBe('rancher/fleet');
      expect(source.icon).toBe('icon icon-application');
      expect(source.showLink).toBe(true);
    });

    it('should return correct source for SOURCE_TYPE.REPO (GitHub SSH)', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            repo:  'git@github.com:rancher/fleet.git',
            chart: 'fleet'
          }
        }
      });

      const source = instance.source;

      expect(source.value).toBe('https://github.com/rancher/fleet');
      expect(source.display).toBe('rancher/fleet');
      expect(source.icon).toBe('icon icon-application');
      expect(source.showLink).toBe(true);
    });

    it('should return correct source for SOURCE_TYPE.OCI', () => {
      instance = new HelmOp({ spec: { helm: { repo: 'oci://ghcr.io/rancher/some-chart' } } });

      const source = instance.source;

      expect(source.value).toBe('oci://ghcr.io');
      expect(source.display).toBe('oci://ghcr.io');
      expect(source.icon).toBe('icon icon-application');
      expect(source.showLink).toBe(false);
    });

    it('should return correct source for SOURCE_TYPE.TARBALL', () => {
      instance = new HelmOp({ spec: { helm: { chart: 'https://github.com/rancher/fleet-helm-charts/releases/download/fleet-0.12.1-beta.2/fleet-0.12.1-beta.2.tgz' } } });

      const source = instance.source;

      expect(source.value).toBe('https://github.com/rancher/fleet-helm-charts/releases/download/fleet-0.12.1-beta.2/fleet-0.12.1-beta.2.tgz');
      expect(source.display).toBe('rancher/fleet-helm-charts/releases/download/fleet-0.12.1-beta.2/fleet-0.12.1-beta.2.tgz');
      expect(source.icon).toBe('icon icon-application');
      expect(source.showLink).toBe(true);
    });

    it('should handle missing helm spec gracefully', () => {
      instance = new HelmOp({ spec: {} });
      const source = instance.source;

      expect(source.value).toBe('');
      expect(source.display).toBeNull();
      expect(source.icon).toBe('icon icon-application');
      expect(source.showLink).toBe(false);
    });
  });

  describe('sourceSub getter', () => {
    it('should display chart name and desired version when both are present (SOURCE_TYPE.REPO)', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            repo:    'https://charts.rancher.io/fleet',
            chart:   'fleet-agent',
            version: '0.12.x'
          }
        }
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('fleet-agent : 0.12.x');
      expect(sourceSub.display).toBe('fleet-agent : 0.12.x');
    });

    it('should display chart name and desired version when both are present (SOURCE_TYPE.OCI)', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            repo:    'oci://ghcr.io/rancher/some-chart',
            version: '1.0.0'
          }
        }
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('rancher/some-chart : 1.0.0');
      expect(sourceSub.display).toBe('rancher/some-chart : 1.0.0');
    });

    it('should display only installed version when only it is present', () => {
      instance = new HelmOp({
        status: { version: '0.12.3' },
        spec:   { helm: {} }
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('0.12.3');
      expect(sourceSub.display).toBe('0.12.3');
    });

    it('should display semantic version when installed version is missing', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            version: '0.12.x',
            chart:   'test-chart'
          }
        }
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('0.12.x');
      expect(sourceSub.display).toBe('0.12.x');
    });

    it('should display "semantic -> installed" when both versions are present (no chart)', () => {
      instance = new HelmOp({
        spec:   { helm: { version: '0.12.x' } },
        status: { version: '0.12.5' }
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('0.12.x -> 0.12.5');
      expect(sourceSub.display).toBe('0.12.x -> 0.12.5');
    });

    it('should display chart and "semantic -> installed" when all are present', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            repo:    'https://charts.rancher.io/fleet',
            chart:   'fleet-agent',
            version: '0.12.x'
          }
        },
        status: { version: '0.12.5' }
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('fleet-agent : 0.12.x -> 0.12.5');
      expect(sourceSub.display).toBe('fleet-agent : 0.12.x -> 0.12.5');
    });

    it('should display chart and only semantic version when all are present but semantic version is equal to installed version (no duplicate info)', () => {
      instance = new HelmOp({
        spec: {
          helm: {
            repo:    'https://charts.rancher.io/fleet',
            chart:   'fleet-agent',
            version: '0.12.3'
          }
        },
        status: { version: '0.12.3' }
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('fleet-agent : 0.12.3');
      expect(sourceSub.display).toBe('fleet-agent : 0.12.3');
    });

    it('should return empty string when no version or chart information is available', () => {
      instance = new HelmOp({
        spec:   { helm: {} },
        status: {}
      });

      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('');
      expect(sourceSub.display).toBe('');
    });

    it('should correctly handle missing helm spec', () => {
      instance = new HelmOp({ spec: {}, status: {} });
      const sourceSub = instance.sourceSub;

      expect(sourceSub.value).toBe('');
      expect(sourceSub.display).toBe('');
    });
  });
});
