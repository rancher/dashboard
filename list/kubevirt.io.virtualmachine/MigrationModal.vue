<script>
import { createNamespacedHelpers, mapGetters } from 'vuex';

import { exceptionToErrorsArray } from '@/utils/error';
import { HOST_CUSTOM_NAME, HARVESTER_MAINTENANCE_STATUS } from '@/config/labels-annotations';
import { NODE, HCI } from '@/config/types';

import LabeledSelect from '@/components/form/LabeledSelect';
import ModalWithCard from '@/components/ModalWithCard';

const { mapState } = createNamespacedHelpers(HCI.VM);

export default {
  components: {
    ModalWithCard,
    LabeledSelect,
  },

  data() {
    return {
      nodeName: '',
      errors:   []
    };
  },

  computed:   {
    ...mapState(['isShowMigration', 'actionResources']),
    ...mapGetters({ t: 'i18n/t' }),

    vmi() {
      const vmiResources = this.$store.getters['cluster/all'](HCI.VMI);
      const resource = vmiResources.find(VMI => VMI.id === this.actionResources?.id) || null;

      return resource;
    },

    nodeNameList() {
      const nodes = this.$store.getters['cluster/all'](NODE);

      return nodes.filter((n) => {
        // do not allow to migrate to self node
        return n.id !== this.vmi?.status?.nodeName && !n.metadata?.annotations?.[HARVESTER_MAINTENANCE_STATUS];
      }).map((n) => {
        let label = n?.metadata?.name;
        const value = n?.metadata?.name;
        const custom = n?.metadata?.annotations?.[HOST_CUSTOM_NAME];

        if (custom) {
          label = custom;
        }

        return {
          label,
          value
        };
      });
    },
  },

  watch: {
    isShowMigration: {
      handler(show) {
        if (show) {
          this.$nextTick(() => {
            this.$modal.show('migration-modal');
          });
        } else {
          this.$modal.hide('migration-modal');
        }
      },
      immediate: true
    },
  },

  methods: {
    close() {
      this.$store.commit('kubevirt.io.virtualmachine/toggleMigrationModal');
      this.nodeName = '';
      this.errors = [];
    },

    async apply(buttonDone) {
      if (!this.actionResources) {
        buttonDone(false);

        return;
      }

      if (!this.nodeName) {
        const name = this.$store.getters['i18n/t']('harvester.vmPage.migrationModal.fields.nodeName.label');
        const message = this.$store.getters['i18n/t']('validation.required', { key: name });

        this.$set(this, 'errors', [message]);
        buttonDone(false);

        return;
      }

      try {
        await this.actionResources.doAction('migrate', { nodeName: this.nodeName }, {}, false);

        buttonDone(true);
        this.close();
      } catch (err) {
        const error = err?.data || exceptionToErrorsArray(err) || err;

        this.$set(this, 'errors', [error]);
      }
    },

  }
};
</script>

<template>
  <ModalWithCard
    ref="migration-modal"
    name="migration-modal"
    save-text="migrate"
    width="40%"
    :pivot-y="0.001"
    :errors="errors"
    @finish="apply"
    @close="close"
  >
    <template #title>
      {{ t('harvester.vmPage.migrationModal.title') }}
    </template>

    <template #content>
      <LabeledSelect
        v-model="nodeName"
        :label="t('harvester.vmPage.migrationModal.fields.nodeName.label')"
        :placeholder="t('harvester.vmPage.migrationModal.fields.nodeName.placeholder')"
        :options="nodeNameList"
      />
    </template>
  </ModalWithCard>
</template>
