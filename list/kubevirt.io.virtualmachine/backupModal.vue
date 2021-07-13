<script>
import { createNamespacedHelpers, mapGetters } from 'vuex';
import { exceptionToErrorsArray } from '@/utils/error';
import { HCI } from '@/config/types';

import ModalWithCard from '@/components/ModalWithCard';
import LabeledInput from '@/components/form/LabeledInput';

const { mapState } = createNamespacedHelpers(HCI.VM);

export default {
  name: 'BackupModal',

  components: { LabeledInput, ModalWithCard },

  data() {
    return {
      backUpName: '',
      errors:     []
    };
  },

  computed: {
    ...mapState(['isShowBackUp', 'actionResources']),
    ...mapGetters({ t: 'i18n/t' }),
  },

  watch: {
    isShowBackUp: {
      handler(show) {
        if (show) {
          this.$nextTick(() => {
            this.$modal.show('backup-modal');
          });
        } else {
          this.$modal.hide('backup-modal');
        }
      },
      immediate: true
    },
  },

  methods: {
    close() {
      this.$store.commit('kubevirt.io.virtualmachine/toggleBackupModal');
      this.backUpName = '';
      this.errors = [];
    },

    async save(buttonCb) {
      if (this.actionResources) {
        if (!this.backUpName) {
          const name = this.$store.getters['i18n/t']('harvester.fields.name');
          const message = this.$store.getters['i18n/t']('validation.required', { key: name });

          this.$set(this, 'errors', [message]);
          buttonCb(false);

          return;
        }

        try {
          const res = await this.actionResources.doAction('backup', { name: this.backUpName }, {}, false);

          if (res._status === 200 || res._status === 204) {
            this.$notify({
              duration: 5000,
              title:    this.t('harvester.notification.title.succeed'),
              message:  this.t('harvester.vmPage.backupModal.success', { backUpName: this.backUpName }),
              type:     'success'
            });

            this.$store.commit('kubevirt.io.virtualmachine/toggleBackupModal');
            this.backUpName = '';

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
  }
};
</script>

<template>
  <ModalWithCard
    ref="backup-modal"
    name="backup-modal"
    width="40%"
    :pivot-y="0.001"
    :errors="errors"
    @finish="save"
    @close="close"
  >
    <template #title>
      {{ t('harvester.backUpPage.backupModal.addBackup') }}
    </template>

    <template #content>
      <LabeledInput
        v-model="backUpName"
        :label="t('generic.name')"
        required
      />
    </template>
  </ModalWithCard>
</template>
