
// No annotatiosn - test case that broke auto-selection of the default storage class
export const exampleStorageClass = {
  allowVolumeExpansion: false,
  apiVersion:           'storage.k8s.io/v1',
  kind:                 'StorageClass',
  metadata:             { name: 'test-no-annotations' },
  parameters:           {
    encrypted: 'true',
    iopsPerGB: '0',
    type:      'gp2'
  },
  provisioner:       'kubernetes.io/aws-ebs',
  reclaimPolicy:     'Delete',
  volumeBindingMode: 'Immediate',
};

// Example default storage class
export const defaultStorageClass = {
  allowVolumeExpansion: false,
  apiVersion:           'storage.k8s.io/v1',
  kind:                 'StorageClass',
  metadata:             {
    name:        'test-default-storage-class',
    annotations: { 'storageclass.kubernetes.io/is-default-class': 'true' }
  },
  parameters: {
    encrypted: 'true',
    iopsPerGB: '0',
    type:      'gp2'
  },
  provisioner:       'kubernetes.io/aws-ebs',
  reclaimPolicy:     'Delete',
  volumeBindingMode: 'Immediate',
};
