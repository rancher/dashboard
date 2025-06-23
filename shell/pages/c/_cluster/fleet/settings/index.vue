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
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        agentCheckinInterval: {
          weight:      0,
          type:        'string',
          path:        'agentCheckinInterval',
          default:     '15m',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        garbageCollectionInterval: {
          weight:      0,
          type:        'string',
          path:        'garbageCollectionInterval',
          default:     '15m',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        clusterEnqueueDelay: {
          weight:      0,
          type:        'string',
          path:        'clusterEnqueueDelay',
          default:     '120s',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        proxy: {
          weight:      0,
          type:        'string',
          path:        'proxy',
          default:     '',
          tooltip:     false,
          info:        false,
          placeholder: true,
        },
        noProxy: {
          weight:      0,
          type:        'string',
          path:        'noProxy',
          default:     '127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.svc,.cluster.local',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        gitClientTimeout: {
          weight:      0,
          type:        'string',
          path:        'gitClientTimeout',
          default:     '30s',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        nodeSelector: {
          weight:      0,
          type:        'object',
          path:        'nodeSelector',
          default:     '{}',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        tolerations: {
          weight:      0,
          type:        'object',
          path:        'tolerations',
          default:     '[]',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        priorityClassName: {
          weight:      0,
          type:        'string',
          path:        'priorityClassName',
          default:     '',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        metrics: {
          weight:      0,
          type:        'boolean',
          path:        'metrics.enabled',
          default:     false,
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        debug: {
          weight:      0,
          type:        'boolean',
          path:        'debug',
          default:     false,
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        controllerReplicas: {
          weight:      0,
          type:        'number',
          path:        'controller.replicas',
          default:     1,
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        gitjobReplicas: {
          weight:      0,
          type:        'number',
          path:        'gitjob.replicas',
          default:     1,
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        helmopsReplicas: {
          weight:      0,
          type:        'number',
          path:        'helmops.replicas',
          default:     1,
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        agentReplicas: {
          weight:      0,
          type:        'number',
          path:        'agent.replicas',
          default:     1,
          tooltip:     false,
          info:        false,
          placeholder: false,
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
    :title="t('fleet.settings.title')"
    :description="t('fleet.settings.description')"
    :label-key-prefix="'fleet.settings'"
    @done="done"
    @errors="e=>errors = e"
  />
</template>

<style scoped lang='scss'>
</style>
