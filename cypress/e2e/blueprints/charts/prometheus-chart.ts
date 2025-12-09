
export const prometheusSpec = {
  chartName:   'rancher-monitoring',
  version:     '102.0.0+up40.1.2',
  releaseName: 'rancher-monitoring',
  values:      {
    prometheus: {
      prometheusSpec: {
        resources:     { requests: { memory: '1750Mi' } },
        retentionSize: '50GiB',
        storageSpec:   {
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
