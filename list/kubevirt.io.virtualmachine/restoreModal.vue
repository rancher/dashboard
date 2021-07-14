<script>
import randomstring from 'randomstring';
import { createNamespacedHelpers, mapGetters } from 'vuex';

import { HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import { exceptionToErrorsArray } from '@/utils/error';

import ModalWithCard from '@/components/ModalWithCard';
import LabeledSelect from '@/components/form/LabeledSelect';

const { mapState } = createNamespacedHelpers(HCI.VM);

export default {
  name: 'RestoreModal',

  components: { LabeledSelect, ModalWithCard },

  async fetch() {
    const hash = await allHash({ backups: this.$store.dispatch('virtual/findAll', { type: HCI.BACKUP }) });

    this.backups = hash.backups;
  },

  data() {
    return {
      backups:    [],
      backupName: '',
      errors:     []
    };
  },

  computed: {
    ...mapState(['actionResources', 'isShowRestore']),
    ...mapGetters({ t: 'i18n/t' }),

    backupOption() {
      const attachBackup = this.backups.filter( (B) => {
        return B.attachVM === this.actionResources?.metadata?.name;
      });

      return attachBackup.map( (O) => {
        return {
          value: O.metadata.name,
          label: O.metadata.name
        };
      });
    },
  },

  watch: {
    isShowRestore: {
      handler(show) {
        if (show) {
          this.$nextTick(() => {
            this.$modal.show('restore-modal');
          });
        } else {
          this.$modal.hide('restore-modal');
        }
      },
      immediate: true
    }
  },

  methods: {
    closeRestore() {
      this.$store.commit('kubevirt.io.virtualmachine/toggleRestoreModal');
      this.backupName = '';
      this.errors = [];
    },

    async saveRestore(buttonCb) {
      const name = `restore-${ this.backupName }-${ randomstring.generate(5).toLowerCase() }`;

      if (!this.backupName) {
        this.$set(this, 'errors', [this.t('harvester.modal.restore.message.backup')]);
        buttonCb(false);

        return;
      }

      try {
        const res = await this.actionResources.doAction('restore', { backupName: this.backupName, name }, {}, false);

        if (res._status === 200 || res._status === 204) {
          this.$store.dispatch('growl/success', {
            title:   this.t('harvester.notification.title.succeed'),
            message: this.t('harvester.modal.restore.success', { name: this.backupName })
          }, { root: true });

          this.closeRestore();
          buttonCb(true);
        } else {
          const error = res?.data || exceptionToErrorsArray(res) || res;

          this.$set(this, 'errors', [error]);
          buttonCb(false);
        }
      } catch (err) {
        const error = err?.data || exceptionToErrorsArray(err) || err;

        this.$set(this, 'errors', [error]);
        buttonCb(false);
      }
    }
  },
};
</script>

<template>
  <ModalWithCard
    ref="restore-modal"
    name="restore-modal"
    width="40%"
    :pivot-y="0.001"
    :errors="errors"
    @finish="saveRestore"
    @close="closeRestore"
  >
    <template #title>
      {{ t('harvester.modal.restore.title') }}
    </template>

    <template #content>
      <LabeledSelect
        v-model="backupName"
        :label="t('harvester.modal.restore.selectBackup')"
        :localized-label="true"
        :options="backupOption"
        required
      />
    </template>
  </ModalWithCard>
</template>
