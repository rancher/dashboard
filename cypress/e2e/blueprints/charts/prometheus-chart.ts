
export const prometheusSpec = {
  chartName:   'rancher-monitoring',
  version:     '102.0.0+up40.1.2',
  releaseName: 'rancher-monitoring',
  values:      {
    prometheus: {
      prometheusSpec: {
        evaluationInterval: '1m',
        resources:          { requests: { memory: '1750Mi' } },
        retentionSize:      '50GiB',
        scrapeInterval:     '1m',
        storageSpec:        {
          volumeClaimTemplate: {
            spec: {
              accessModes: [
                'ReadWriteOnce'
              ],
              resources:        { requests: { storage: '50Gi' } },
              storageClassName: 'local-path'
            }
          }
        }
      }
    }
  }
};
