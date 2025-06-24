<script lang="ts">
import ConfigMapSettings, { Setting } from '@shell/components/ConfigMapSettings.vue';

export default {

  name: 'FleetSettings',

  components: { ConfigMapSettings },

  data() {
    return { errors: [] };
  },

  computed: {
    settings() {
      return {
        agentTLSMode: {
          weight: 0,
          type:   'string',
          items:  [{
            type:  'string',
            value: 'strict'
          }, {
            type:  'string',
            value: 'system-store'
          }],
          path:        'agentTLSMode',
          default:     'system-store',
        },
        agentCheckinInterval: {
          weight:      0,
          type:        'string',
          path:        'agentCheckinInterval',
          default:     '15m',
        },
        garbageCollectionInterval: {
          weight:      0,
          type:        'string',
          path:        'garbageCollectionInterval',
          default:     '15m',
        },
        clusterEnqueueDelay: {
          weight:      0,
          type:        'string',
          path:        'clusterEnqueueDelay',
          default:     '120s',
        },
        proxy: {
          weight:      0,
          type:        'string',
          path:        'proxy',
          default:     '',
          placeholder: true,
        },
        noProxy: {
          weight:      0,
          type:        'string',
          path:        'noProxy',
          default:     '127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.svc,.cluster.local',
        },
        gitClientTimeout: {
          weight:      0,
          type:        'string',
          path:        'gitClientTimeout',
          default:     '30s',
        },
        nodeSelector: {
          weight:      0,
          type:        'object',
          path:        'nodeSelector',
          default:     {},
        },
        tolerations: {
          weight:      0,
          type:        'object',
          path:        'tolerations',
          default:     [],
        },
        priorityClassName: {
          weight:      0,
          type:        'string',
          path:        'priorityClassName',
          default:     '',
        },
        metrics: {
          weight:      0,
          type:        'boolean',
          path:        'metrics.enabled',
          default:     false,
        },
        debug: {
          weight:      0,
          type:        'boolean',
          path:        'debug',
          default:     false,
        },
        controllerReplicas: {
          weight:      0,
          type:        'number',
          path:        'controller.replicas',
          default:     1,
        },
        gitjobReplicas: {
          weight:      0,
          type:        'number',
          path:        'gitjob.replicas',
          default:     1,
        },
        helmopsReplicas: {
          weight:      0,
          type:        'number',
          path:        'helmops.replicas',
          default:     1,
        },
        agentReplicas: {
          weight:      0,
          type:        'number',
          path:        'agent.replicas',
          default:     1,
        }

      } as Record<string, Setting>;
    },
  },

  methods: {
    done() {
    }
  }
};
</script>

<template>
  <ConfigMapSettings
    :settings="settings"
    :namespace="'cattle-system'"
    :name="'rancher-config'"
    :data-key="'fleet'"
    :in-store="'management'"
    :label-key-prefix="'fleet.settings'"
    @done="done"
    @errors="e=>errors = e"
  />
</template>

<style scoped lang='scss'>
</style>
