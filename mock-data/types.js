import { HCI } from '~/shell/config/types';

export const pciDevice = {
  apiVersion: 'harvesterhci.io.github.com/v1beta1',
  kind:       'PCIDevice',
  type:       HCI.PCI_DEVICE,
  id:         'pcidevice-sample',
  metadata:   { name: 'pcidevice-sample' },
  status:     {
    address:  '00:1f.6',
    vendorId: '8086',
    deviceId: '0d4c'
  },
  node: {
    systemUUID: '30363150-3530-584d-5132-303730435a33',
    name:       'titan'
  },
  description:       'Ethernet controller: Intel Corporation Ethernet Connection (11) I219-LM',
  kernelDriverInUse: 'e1000e',
  kernelModules:     ['e1000e']
};

export const pciPassthrough = {
  apiVersion: 'harvesterhci.io.github.com/v1beta1',
  kind:       'PCIPassthroughRequest',
  metadata:   { name: 'pcipassthroughrequest-sample' },
  spec:       {
    pciAddress:     '00:1f.6',
    nodeSystemUUID:  '30363150-3530-584d-5132-303730435a33'
  },
  status: { result: 'Succeeded' }
};
