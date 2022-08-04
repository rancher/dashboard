import { randomStr } from '~/shell/utils/string';
import { HCI } from '../pkg/harvester/types';
// TODO uninstall this
import { LoremIpsum } from 'lorem-ipsum';

const NUM_NODES = 10;

// each is how many of a given device a single node might have
// freq is what portion of nodes (approx) have this device
const DEVICE_FREQUENCY = [
  {
    each: [1],
    freq: 1
  },
  {
    each: [1],
    freq: 0.2
  },
  {
    each: [2],
    freq: 0.5
  },
  {
    each: [1, 2],
    freq: 0.5
  },
  // {
  //   each: [2],
  //   freq: 0.2
  // },
  // {
  //   each: [3],
  //   freq: 0.2
  // },
  // {
  //   each: [1, 2],
  //   freq: 1
  // },
];

// node can have multiple of same device - same deviceid, vendorid, different addr
// addr is unique within a node(?)
// can't have same device id, different vendor id(?)

const randomNodeNameUUID = () => {
  return {
    systemUUID: `30363150-3530-584d-5132-303730435${ randomStr(3) }`,
    name:       `node-${ randomStr(Math.random() * (12 - 5) + 5) }`
  };
};

const randomDeviceName = () => `device-${ randomStr(Math.random() * (20 - 2) + 2) }`;

const randomDeviceVendorIds = () => {
  return {
    deviceId: (Math.floor(Math.random() * 10000)).toString().padEnd(4, '0'),
    vendorId: (Math.floor(Math.random() * 10000)).toString().padEnd(4, '0')
  };
};

const randomAddress = () => {
  return `${ (Math.floor(Math.random() * 100)).toString(16) }:${ (Math.floor(Math.random() * 100)).toString(16) }.${ (Math.floor(Math.random() * 10)).toString(16) }`;
};

const lorem = new LoremIpsum({
  wordsPerSentence: {
    max: 12,
    min: 4
  }
});

// generate an array of 'nodes' as they are defined in the PciDeviceCRD
const nodeOpts = [];

for (let i = 0; i <= NUM_NODES; i++) {
  nodeOpts.push(randomNodeNameUUID());
}

const devices = [];

DEVICE_FREQUENCY.forEach(({ each, freq }) => {
  // generate fields that every node with this device will share
  const { vendorId, deviceId } = randomDeviceVendorIds();
  const description = `(device ${ vendorId }:${ deviceId }) ${ lorem.generateSentences(1) } `;
  // calc how many nodes will have this device and select that number at random
  const numberNodes = Math.ceil(NUM_NODES * freq) || 1;
  const selectedNodes = [];

  while (selectedNodes.length < numberNodes) {
    // pick a node at random
    const randomIdx = Math.floor(Math.random() * NUM_NODES);
    const potentialNode = nodeOpts[randomIdx];

    // make sure it's not already selected, and select it
    if (!selectedNodes.find(node => node.name === potentialNode.name)) {
      selectedNodes.push(potentialNode);
    }
  }
  // randomly determine quantity of the device that this node will have, and make them
  selectedNodes.forEach((node) => {
    const numberInThisNode = each[Math.floor(Math.random() * each.length)];

    for (let i = 0; i < numberInThisNode; i++) {
      const deviceName = randomDeviceName();

      const address = randomAddress();
      const device = {
        apiVersion: 'harvesterhci.io.github.com/v1beta1',
        kind:       'PCIDevice',
        type:       HCI.PCI_DEVICE,
        id:         `${ deviceName }`,
        metadata:   { name: deviceName },
        status:     {
          address,
          vendorId,
          deviceId,
          nodeName:          node.name,
          description,
          kernelDriverInUse: 'e1000e',
          kernelModules:     ['e1000e']
        },

      };

      devices.push(device);
    }
  });

  return devices;
});

export const mockedPCIDevices = devices;
