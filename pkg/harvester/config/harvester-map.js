export const MemoryUnit = [{
  label: 'Mi',
  value: 'Mi'
}, {
  label: 'Gi',
  value: 'Gi'
},
{
  label: 'TiB',
  value: 'Ti'
}];

export const InterfaceOption = [{
  label: 'VirtIO',
  value: 'virtio'
}, {
  label: 'SATA',
  value: 'sata'
}, {
  label: 'SCSI',
  value: 'scsi'
}];

export const SOURCE_TYPE = {
  NEW:           'New',
  IMAGE:         'VM Image',
  ATTACH_VOLUME: 'Existing Volume',
  CONTAINER:     'Container'
};

export const VOLUME_TYPE = [{
  label: 'disk',
  value: 'disk'
}, {
  label: 'cd-rom',
  value: 'cd-rom'
}];

export const ACCESS_CREDENTIALS = {
  RESET_PWD:  'userPassword',
  INJECT_SSH: 'sshPublicKey'
};

export const RunStrategys = ['Always', 'RerunOnFailure', 'Manual', 'Halted'];
