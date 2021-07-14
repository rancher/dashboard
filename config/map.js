export const mapKind = {
  VirtualMachine:              'Virtual Machine',
  Node:                        'Host',
  NetworkAttachmentDefinition: 'Network',
  VirtualMachineImage:         'Image',
  DataVolume:                  'Volume'
};

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
  NEW:            'New',
  IMAGE:          'VM Image',
  ATTACH_VOLUME:  'Existing Volume',
  CONTAINER:     'Container'
};
