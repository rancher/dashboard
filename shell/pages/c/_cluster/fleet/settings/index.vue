<script lang="ts">
import ConfigMapSettings, { Group, Setting } from '@shell/components/ConfigMapSettings/index.vue';

export default {

  name: 'FleetSettings',

  components: { ConfigMapSettings },

  computed: {
    settings(): Record<string, Setting> {
      return {
        // 'general' group
        nodeSelector: {
          weight:  0,
          type:    'object',
          handler: 'KeyValue',
          path:    'nodeSelector',
          default: {},
          class:   'span-8',
        },
        tolerations: {
          weight:  1,
          type:    'object',
          handler: 'Taints',
          path:    'tolerations',
          default: [],
          class:   'span-8',
        },
        garbageCollectionInterval: {
          weight:  2,
          type:    'number',
          handler: 'UnitInput',
          path:    'garbageCollectionInterval',
          default: '15m',
        },
        priorityClassName: {
          weight:  3,
          type:    'string',
          path:    'priorityClassName',
          default: '',
        },
        gitClientTimeout: {
          weight:  4,
          type:    'number',
          handler: 'UnitInput',
          path:    'gitClientTimeout',
          default: '30s',
        },
        proxy: {
          weight:      5,
          type:        'string',
          path:        'proxy',
          default:     '',
          placeholder: true,
          class:       'span-8',
        },
        noProxy: {
          weight:  6,
          type:    'string',
          path:    'noProxy',
          default: '127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.svc,.cluster.local',
          class:   'span-8',
        },
        clusterEnqueueDelay: {
          weight:  7,
          type:    'number',
          handler: 'UnitInput',
          path:    'clusterEnqueueDelay',
          default: '120s',
        },

        // 'replicas' group
        controllerReplicas: {
          weight:  0,
          type:    'number',
          path:    'controller.replicas',
          default: 1,
        },
        agentReplicas: {
          weight:  1,
          type:    'number',
          path:    'agent.replicas',
          default: 1,
        },
        gitjobReplicas: {
          weight:  2,
          type:    'number',
          path:    'gitjob.replicas',
          default: 1,
        },
        helmopsReplicas: {
          weight:  3,
          type:    'number',
          path:    'helmops.replicas',
          default: 1,
        },

        // 'agent' group
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
          type:    'number',
          handler: 'UnitInput',
          path:    'agentCheckinInterval',
          default: '15m',
        },

        // 'annotations' group
        controllerAnnotations: {
          weight:  0,
          type:    'object',
          handler: 'KeyValue',
          path:    'extraAnnotations.fleetController',
          default: {},
          class:   'span-8',
        },
        gitjobAnnotations: {
          weight:  1,
          type:    'object',
          handler: 'KeyValue',
          path:    'extraAnnotations.gitjob',
          default: {},
          class:   'span-8',
        },
        helmopsAnnotations: {
          weight:  2,
          type:    'object',
          handler: 'KeyValue',
          path:    'extraAnnotations.helmops',
          default: {},
          class:   'span-8',
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
          'clusterEnqueueDelay',
          'nodeSelector',
          'priorityClassName',
          'tolerations',
        ],
        expanded: true,
        weight:   0
      }, {
        name:     'agent',
        children: [
          'agentTLSMode',
          'agentCheckinInterval'
        ],
        weight: 1
      }, {
        name:     'replicas',
        children: [
          'controllerReplicas',
          'gitjobReplicas',
          'helmopsReplicas',
          'agentReplicas',
        ],
        weight: 2
      }, {
        name:     'annotations',
        children: [
          'controllerAnnotations',
          'gitjobAnnotations',
          'helmopsAnnotations'
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
    :show-info="true"
  />
</template>

<style scoped lang='scss'>
</style>
