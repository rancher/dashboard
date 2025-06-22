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
        singleSelect: {
          weight: 0,
          type:   'string',
          path:   'singleSelect',
          items:  [{
            type:  'string',
            value: 'aaa'
          }, {
            type:  'string',
            value: 'bbb'
          }],
          default:     'aaa',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },

        multiSelect: {
          weight: 0,
          type:   'array',
          path:   'multiSelect',
          items:  [{
            type:  'string',
            value: 'aaa'
          }, {
            type:  'string',
            value: 'bbb'
          }],
          default:     'aaa',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },

        gitRepoReconciler: {
          weight:      0,
          type:        'number',
          path:        'controller.reconciler.workers.gitrepo',
          default:     '50',
          tooltip:     false,
          info:        false,
          placeholder: false,
        },
        agentTLSMode: {
          weight:      0,
          type:        'string',
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
        debug: {
          weight:      0,
          type:        'boolean',
          path:        'debug',
          default:     false,
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
