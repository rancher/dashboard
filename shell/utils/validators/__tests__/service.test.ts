import { servicePort, clusterIp, externalName } from '@shell/utils/validators/service';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/service', () => {
  describe('servicePort', () => {
    it('returns errors unchanged when serviceType is ExternalName', () => {
      const errors: string[] = [];
      const result = servicePort({ type: 'ExternalName', ports: [] }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });

    it('adds required error when ports is empty', () => {
      const errors: string[] = [];
      const result = servicePort({ type: 'ClusterIP', ports: [] }, mockGetters, errors, {});

      expect(result).toStrictEqual(['validation.required:{"key":"Port Rules"}']);
    });

    it('adds required error when ports is null', () => {
      const errors: string[] = [];
      const result = servicePort({ type: 'ClusterIP', ports: null }, mockGetters, errors, {});

      expect(result).toContain('validation.required:{"key":"Port Rules"}');
    });

    it('requires port name when there are multiple ports', () => {
      const errors: string[] = [];
      const ports = [
        {
          name: '', port: 80, targetPort: 8080, nodePort: null
        },
        {
          name: '', port: 443, targetPort: 8443, nodePort: null
        },
      ];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).toContain('validation.service.ports.name.required:{"position":1}');
      expect(result).toContain('validation.service.ports.name.required:{"position":2}');
    });

    it('does not require name when only one port', () => {
      const errors: string[] = [];
      const ports = [{
        name: '', port: 80, targetPort: 8080
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).not.toContain('validation.service.ports.name.required:{"position":1}');
    });

    it('adds error when nodePort is not a valid integer', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', nodePort: 'abc', port: 80, targetPort: 8080
      }];
      const result = servicePort({ type: 'NodePort', ports }, mockGetters, errors, {});

      expect(result).toContain('validation.service.ports.nodePort.requiredInt:{"position":1}');
    });

    it('does not add nodePort error when nodePort is a valid integer string', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', nodePort: '30000', port: 80, targetPort: 8080
      }];
      const result = servicePort({ type: 'NodePort', ports }, mockGetters, errors, {});

      expect(result).not.toContain('validation.service.ports.nodePort.requiredInt:{"position":1}');
    });

    it('does not add nodePort error when nodePort is falsy', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', nodePort: null, port: 80, targetPort: 8080
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).not.toContain('validation.service.ports.nodePort.requiredInt:{"position":1}');
    });

    it('adds error when port is not a valid integer', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: 'notanum', targetPort: 8080
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).toContain('validation.service.ports.port.requiredInt:{"position":1}');
    });

    it('adds required error when port is missing', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: null, targetPort: 8080
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).toContain('validation.service.ports.port.required:{"position":1}');
    });

    it('adds required error when targetPort is missing', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: 80, targetPort: null
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).toContain('validation.service.ports.targetPort.required:{"position":1}');
    });

    it('does not add error for valid numeric targetPort within range', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: 80, targetPort: '8080'
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).not.toContain('validation.service.ports.targetPort.between:{"position":1}');
    });

    it('adds error when numeric targetPort is out of range (below 1)', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: 80, targetPort: '0'
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).toContain('validation.service.ports.targetPort.between:{"position":1}');
    });

    it('adds error when numeric targetPort is out of range (above 65535)', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: 80, targetPort: '65536'
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).toContain('validation.service.ports.targetPort.between:{"position":1}');
    });

    it('validates IANA service name for non-numeric targetPort', () => {
      const errors: string[] = [];
      // valid IANA name: alphanumeric+hyphen, not starting/ending with hyphen, contains letter
      const ports = [{
        name: 'http', port: 80, targetPort: 'valid-name'
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      // valid IANA name should not add errors for targetPort
      const targetPortErrors = result.filter((e: string) => e.includes('targetPort'));

      expect(targetPortErrors).toHaveLength(0);
    });

    it('adds error for invalid IANA service name (too long)', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: 80, targetPort: 'a-very-long-name-here'
      }]; // > 15 chars
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      const targetPortErrors = result.filter((e: string) => e.includes('targetPort') || e.includes('length'));

      expect(targetPortErrors.length).toBeGreaterThan(0);
    });

    it('validates port name using DNS label rules', () => {
      const errors: string[] = [];
      const ports = [{
        name: '-invalid', port: 80, targetPort: 8080
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      const nameErrors = result.filter((e: string) => e.includes('startHyphen') || e.includes('name'));

      expect(nameErrors.length).toBeGreaterThan(0);
    });

    it('returns no errors for a valid single port spec', () => {
      const errors: string[] = [];
      const ports = [{
        name: 'http', port: 80, targetPort: '8080'
      }];
      const result = servicePort({ type: 'ClusterIP', ports }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });
  });

  describe('clusterIp', () => {
    it('returns errors unchanged for ExternalName service type', () => {
      const errors = ['existing'];
      const result = clusterIp({ type: 'ExternalName' }, mockGetters, errors, {});

      expect(result).toStrictEqual(['existing']);
    });

    it('returns errors unchanged for ClusterIP type (no additional validation)', () => {
      const errors: string[] = [];
      const result = clusterIp({ type: 'ClusterIP' }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });

    it('returns errors unchanged for NodePort type', () => {
      const errors: string[] = [];
      const result = clusterIp({ type: 'NodePort' }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });

    it('returns errors unchanged for LoadBalancer type', () => {
      const errors: string[] = [];
      const result = clusterIp({ type: 'LoadBalancer' }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });

    it('skips validation for unsupported service types', () => {
      const errors = ['pre-existing'];
      const result = clusterIp({ type: 'Headless' }, mockGetters, errors, {});

      expect(result).toStrictEqual(['pre-existing']);
    });
  });

  describe('externalName', () => {
    it('returns errors unchanged when serviceType is not ExternalName', () => {
      const errors: string[] = [];
      const result = externalName({ type: 'ClusterIP', externalName: '' }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });

    it('returns errors unchanged when spec.type is undefined', () => {
      const errors: string[] = [];
      const result = externalName({ type: undefined }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });

    it('adds error when externalName is missing for ExternalName service', () => {
      const errors: string[] = [];
      const result = externalName({ type: 'ExternalName', externalName: '' }, mockGetters, errors, {});

      expect(result).toContain('validation.service.externalName.none');
    });

    it('adds error when externalName is null for ExternalName service', () => {
      const errors: string[] = [];
      const result = externalName({ type: 'ExternalName', externalName: null }, mockGetters, errors, {});

      expect(result).toContain('validation.service.externalName.none');
    });

    it('returns no errors for valid hostname in ExternalName service', () => {
      const errors: string[] = [];
      const result = externalName({ type: 'ExternalName', externalName: 'my-service.example.com' }, mockGetters, errors, {});

      expect(result).toStrictEqual([]);
    });

    it('returns errors for invalid hostname in ExternalName service', () => {
      const errors: string[] = [];
      const result = externalName({ type: 'ExternalName', externalName: '-invalid-.example.com' }, mockGetters, errors, {});

      expect(result.length).toBeGreaterThan(0);
    });

    it('preserves pre-existing errors when adding new hostname errors', () => {
      const errors = ['pre-existing-error'];
      const result = externalName({ type: 'ExternalName', externalName: '-bad' }, mockGetters, errors, {});

      expect(result).toContain('pre-existing-error');
    });
  });
});
