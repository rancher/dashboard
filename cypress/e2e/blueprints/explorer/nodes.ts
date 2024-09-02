// A dummy node that does not have all of the data that a normal provisioned node would have
// but can exist when using nodes from external tools
export const dummyNode = {
  apiVersion:  'v1',
  kind:        'Node',
  metadata:    { name: 'bigip1' },
  annotations: {
    'flannel.alpha.coreos.com/public-ip':           '10.10.168.2',
    'flannel.alpha.coreos.com/backend-data':        '{"VtepMAC":"00:0a:49:ce:c3:82"}',
    'flannel.alpha.coreos.com/backend-type':        'vxlan',
    'flannel.alpha.coreos.com/kube-subnet-manager': 'true',
  },
  spec: { podCIDR: '10.42.255.0/24' }
};
