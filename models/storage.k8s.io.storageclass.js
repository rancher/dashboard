export const PROVISIONER_OPTIONS = [
  {
    labelKey: 'storageClass.aws-ebs.title',
    value:    'kubernetes.io/aws-ebs'
  },
  {
    labelKey: 'storageClass.azure-disk.title',
    value:    'kubernetes.io/azure-disk'
  },
  {
    labelKey: 'storageClass.azure-file.title',
    value:    'kubernetes.io/azure-file'
  },
  {
    labelKey: 'storageClass.gce-pd.title',
    value:    'kubernetes.io/gce-pd'
  },
  {
    labelKey: 'storageClass.longhorn.title',
    value:    'driver.longhorn.io'
  },
  {
    labelKey: 'storageClass.vsphere-volume.title',
    value:    'kubernetes.io/vsphere-volume'
  }
];

export default {
  provisionerDisplay() {
    const option = PROVISIONER_OPTIONS.find(o => o.value === this.provisioner);

    return option ? this.t(option.labelKey) : this.provisioner;
  }
};
