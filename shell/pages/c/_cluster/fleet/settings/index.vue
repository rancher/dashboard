<script lang="ts">
import ConfigMapSettings, { Group, Setting } from '@shell/components/ConfigMapSettings/index.vue';

export default {

  name: 'FleetSettings',

  components: { ConfigMapSettings },

  computed: {
    settings(): Record<string, Setting> {
      return {
        // 'general' group
        garbageCollectionInterval: {
          weight:  0,
          type:    'string',
          path:    'garbageCollectionInterval',
          default: '15m',
        },
        gitClientTimeout: {
          weight:  1,
          type:    'string',
          path:    'gitClientTimeout',
          default: '30s',
        },
        proxy: {
          weight:      2,
          type:        'string',
          path:        'proxy',
          default:     '',
          placeholder: true,
        },
        noProxy: {
          weight:  3,
          type:    'string',
          path:    'noProxy',
          default: '127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.svc,.cluster.local',
        },
        clusterEnqueueDelay: {
          weight:  4,
          type:    'string',
          path:    'clusterEnqueueDelay',
          default: '120s',
        },

        // 'controller' group
        controllerReplicas: {
          weight:  0,
          type:    'number',
          path:    'controller.replicas',
          default: 1,
        },
        gitjobReplicas: {
          weight:  1,
          type:    'number',
          path:    'gitjob.replicas',
          default: 1,
        },
        helmopsReplicas: {
          weight:  2,
          type:    'number',
          path:    'helmops.replicas',
          default: 1,
        },

        // 'agent' group
        agentReplicas: {
          weight:  0,
          type:    'number',
          path:    'agent.replicas',
          default: 1,
        },
        agentTLSMode: {
          weight: 1,
          type:   'string',
          items:  [{
            type:  'string',
            value: 'strict'
          }, {
            type:  'string',
            value: 'system-store'
          }],
          path:    'agentTLSMode',
          default: 'system-store',
        },
        agentCheckinInterval: {
          weight:  2,
          type:    'string',
          path:    'agentCheckinInterval',
          default: '15m',
        },

        // 'resource-definition' group
        priorityClassName: {
          weight:  0,
          type:    'string',
          path:    'priorityClassName',
          default: '',
        },
        nodeSelector: {
          weight:  1,
          type:    'object',
          path:    'nodeSelector',
          default: {},
        },
        tolerations: {
          weight:  2,
          type:    'object',
          path:    'tolerations',
          default: [],
        },
        extraAnnotations: {
          weight:  3,
          type:    'object',
          path:    'extraAnnotations',
          default: {},
        },

        // 'developer' group
        metrics: {
          weight:  0,
          type:    'boolean',
          path:    'metrics.enabled',
          default: false,
        },
        debug: {
          weight:  1,
          type:    'boolean',
          path:    'debug',
          default: false,
        }
      };
    },

    groups(): Group[] {
      return [{
        name:     'general',
        children: [
          'garbageCollectionInterval',
          'gitClientTimeout',
          'proxy',
          'noProxy',
          'clusterEnqueueDelay'
        ],
        weight: 0
      }, {
        name:     'controller',
        children: [
          'controllerReplicas',
          'gitjobReplicas',
          'helmopsReplicas',
        ],
        weight: 1
      }, {
        name:     'agent',
        children: [
          'agentReplicas',
          'agentTLSMode',
          'agentCheckinInterval'
        ],
        weight: 2
      }, {
        name:     'modifiers',
        children: [
          'nodeSelector',
          'priorityClassName',
          'tolerations',
          'extraAnnotations'
        ],
        weight: 3
      }, {
        name:     'developer',
        children: [
          'metrics',
          'debug'
        ],
        weight: 4
      }];
    }
  }
};
</script>

<template>
  <ConfigMapSettings
    :settings="settings"
    :groups="groups"
    :namespace="'cattle-system'"
    :name="'rancher-config'"
    :data-key="'fleet'"
    :in-store="'management'"
    :label-key-prefix="'fleet.settings'"
  />
</template>

<style scoped lang='scss'>
</style>
