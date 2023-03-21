<script>
import { resourceNames } from '@shell/utils/string';
import SortableTable from '@shell/components/SortableTable';

export default {
  name:       'PromptRemoveMacvlan',
  components: { SortableTable },

  props: {
    type: {
      type:    String,
      default: ''
    },
    names: {
      type: Array,
      default() {
        return [];
      }
    },
    plusMore: {
      type:    String,
      default: ''
    }
  },
  methods:  { resourceNames },
  computed: {
    headers() {
      return [
        {
          name:      'name',
          label:     'Name',
          value:     'name',
          width:     120,
          formatter: 'MacvlanName'
        },
        {
          name:  'namespace',
          label: 'Namespace',
          value: 'metadata.namespace',
          width: 120,
        },
        {
          name:  'workload',
          label: 'Workload',
          value: 'metadata.workload',
          width: 120,
        },
        {
          name:  'ip',
          label: 'IP',
          value: 'metadata.ip',
          width: 120,
        },
      ];
    },
    rows() {
      return [{
        apiVersion: 'macvlan.cluster.cattle.io/v1',
        kind:       'MacvlanSubnet',
        metadata:   {
          name:      'test',
          namespace: 'kube-system',
          labels:    { project: '' }
        },
        spec: {
          master:            'ens5',
          vlan:              10,
          cidr:              '192.168.1.1/24',
          mode:              'bridge',
          gateway:           '',
          ranges:            [],
          routes:            [],
          podDefaultGateway: {
            enable:      false,
            serviceCidr: ''
          }
        }
      }];
    }
  }
};
</script>
<template>
  <div>
    <SortableTable
      key-field="_key"
      :headers="headers"
      :rows="rows"
      :row-actions="false"
      :table-actions="false"
      :search="false"
    />
  </div>
</template>
