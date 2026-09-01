import { shallowMount } from '@vue/test-utils';
import ServiceTargets from '@shell/components/formatter/ServiceTargets.vue';

describe('component: ServiceTargets', () => {
  const proxyUrl = (scheme: string, port: number) => `https://rancher.test/k8s/clusters/local/api/v1/namespaces/default/services/${ scheme }:test-service:${ port }/proxy`;

  function createRow(overrides: Record<string, any> = {}) {
    return {
      metadata: { annotations: {}, ...overrides.metadata },
      spec:     {
        clusterIP: '10.43.0.100',
        ports:     [],
        type:      'ClusterIP',
        ...overrides.spec,
      },
      proxyUrl,
    };
  }

  function mountComponent(row: Record<string, any>) {
    return shallowMount(ServiceTargets, {
      props: {
        value: null,
        row,
        col:   {},
      },
      global: { directives: { 'clean-html': () => {} } },
    });
  }

  describe('default port handling', () => {
    it.each([
      ['80', 80],
      ['443', 443],
      ['8080', 8080],
      ['8443', 8443],
    ])('should generate a clickable link for TCP port %s', (_label, port) => {
      const row = createRow({
        spec: {
          ports: [{
            port, protocol: 'TCP', targetPort: port
          }]
        }
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toContain('<a href=');
      expect(parsed[0].label).toContain(`proxy`);
    });

    it.each([
      ['3000', 3000],
      ['9090', 9090],
      ['5000', 5000],
    ])('should NOT generate a clickable link for TCP port %s without annotation', (_label, port) => {
      const row = createRow({
        spec: {
          ports: [{
            port, protocol: 'TCP', targetPort: port
          }]
        }
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).not.toContain('<a href=');
    });

    it('should NOT generate a clickable link for non-TCP protocol', () => {
      const row = createRow({
        spec: {
          ports: [{
            port: 80, protocol: 'UDP', targetPort: 80
          }]
        }
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).not.toContain('<a href=');
    });
  });

  describe('service-links annotation', () => {
    it('should generate a clickable link for a port listed in the annotation', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000' } },
        spec:     {
          ports: [{
            port: 3000, protocol: 'TCP', targetPort: 3000
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toContain('<a href=');
      expect(parsed[0].label).toContain('http:test-service:3000');
    });

    it('should generate clickable links for multiple ports in the annotation', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000,9090' } },
        spec:     {
          ports: [
            {
              port: 3000, protocol: 'TCP', targetPort: 3000
            },
            {
              port: 9090, protocol: 'TCP', targetPort: 9090
            },
            {
              port: 5000, protocol: 'TCP', targetPort: 5000
            },
          ],
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(3);
      expect(parsed[0].label).toContain('<a href=');
      expect(parsed[1].label).toContain('<a href=');
      expect(parsed[2].label).not.toContain('<a href=');
    });

    it('should still generate links for default ports (80, 443) even without annotation', () => {
      const row = createRow({
        spec: {
          ports: [
            {
              port: 80, protocol: 'TCP', targetPort: 80
            },
            {
              port: 443, protocol: 'TCP', targetPort: 443
            },
          ],
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(2);
      expect(parsed[0].label).toContain('<a href=');
      expect(parsed[1].label).toContain('<a href=');
    });

    it('should handle whitespace in the annotation value', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': ' 3000 , 9090 ' } },
        spec:     {
          ports: [
            {
              port: 3000, protocol: 'TCP', targetPort: 3000
            },
            {
              port: 9090, protocol: 'TCP', targetPort: 9090
            },
          ],
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(2);
      expect(parsed[0].label).toContain('<a href=');
      expect(parsed[1].label).toContain('<a href=');
    });

    it('should handle an empty annotation value gracefully', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '' } },
        spec:     {
          ports: [{
            port: 3000, protocol: 'TCP', targetPort: 3000
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).not.toContain('<a href=');
    });

    it('should ignore non-numeric values in the annotation', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000,abc,9090' } },
        spec:     {
          ports: [
            {
              port: 3000, protocol: 'TCP', targetPort: 3000
            },
            {
              port: 9090, protocol: 'TCP', targetPort: 9090
            },
          ],
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(2);
      expect(parsed[0].label).toContain('<a href=');
      expect(parsed[1].label).toContain('<a href=');
    });

    it('should not generate a link for annotated port with non-TCP protocol', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000' } },
        spec:     {
          ports: [{
            port: 3000, protocol: 'UDP', targetPort: 3000
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).not.toContain('<a href=');
    });

    it('should use https scheme for annotated port that isMaybeSecure considers secure', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '8443' } },
        spec:     {
          ports: [{
            port: 8443, protocol: 'TCP', targetPort: 8443
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toContain('https:test-service:8443');
    });

    it('should use http scheme for annotated port that is not secure', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000' } },
        spec:     {
          ports: [{
            port: 3000, protocol: 'TCP', targetPort: 3000
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toContain('http:test-service:3000');
    });

    it('should use explicit https scheme from annotation even for non-secure port', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000/https' } },
        spec:     {
          ports: [{
            port: 3000, protocol: 'TCP', targetPort: 3000
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toContain('https:test-service:3000');
    });

    it('should use explicit http scheme from annotation even for secure port', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '8443/http' } },
        spec:     {
          ports: [{
            port: 8443, protocol: 'TCP', targetPort: 8443
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toContain('http:test-service:8443');
    });

    it('should not add port 0 from trailing comma in annotation', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000,' } },
        spec:     {
          ports: [
            {
              port: 3000, protocol: 'TCP', targetPort: 3000
            },
            {
              port: 0, protocol: 'TCP', targetPort: 0
            },
          ],
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(2);
      expect(parsed[0].label).toContain('<a href=');
      expect(parsed[1].label).not.toContain('<a href=');
    });

    it('should fall back to isMaybeSecure for invalid scheme values', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000/ftp' } },
        spec:     {
          ports: [{
            port: 3000, protocol: 'TCP', targetPort: 3000
          }]
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toContain('http:test-service:3000');
    });

    it('should handle mixed format with and without explicit scheme', () => {
      const row = createRow({
        metadata: { annotations: { 'ui.rancher/service-links': '3000/https,9090' } },
        spec:     {
          ports: [
            {
              port: 3000, protocol: 'TCP', targetPort: 3000
            },
            {
              port: 9090, protocol: 'TCP', targetPort: 9090
            },
          ],
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(2);
      expect(parsed[0].label).toContain('https:test-service:3000');
      expect(parsed[1].label).toContain('http:test-service:9090');
    });
  });

  describe('empty ports', () => {
    it('should show clusterIP when ports are empty', () => {
      const row = createRow({ spec: { clusterIP: '10.43.0.100', ports: [] } });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toBe('10.43.0.100:');
    });

    it('should show externalName for ExternalName service type', () => {
      const row = createRow({
        spec: {
          clusterIP:    '',
          ports:        [],
          type:         'ExternalName',
          externalName: 'my.external.service',
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed).toHaveLength(1);
      expect(parsed[0].label).toBe('my.external.service');
    });
  });

  describe('port label formatting', () => {
    it('should use port name when available in clickable link', () => {
      const row = createRow({
        spec: {
          ports: [{
            port: 80, protocol: 'TCP', targetPort: 80, name: 'http-web',
          }],
        },
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed[0].label).toContain('>http-web</a>');
    });

    it('should include target port and protocol in label', () => {
      const row = createRow({
        spec: {
          ports: [{
            port: 3000, protocol: 'TCP', targetPort: 8080
          }]
        }
      });
      const wrapper = mountComponent(row);
      const parsed = (wrapper.vm as any).parsed;

      expect(parsed[0].label).toContain('10.43.0.100:3000');
      expect(parsed[0].label).toContain('8080');
      expect(parsed[0].label).toContain('/TCP');
    });
  });
});
