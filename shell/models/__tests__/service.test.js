import Service, { CLUSTERIP, EXTERNALIP } from '@shell/models/service.js';

describe('class Service', () => {
  it('should contain the external ip service type', () => {
    const service = new Service({
      spec: {
        type:      CLUSTERIP,
        clusterIP: 'None'
      },
      metadata: { annotations: { 'field.cattle.io/ipAddresses': '["10.1.1.2"]' } }
    });

    expect(service.serviceType).toBe(EXTERNALIP);
  });
});
