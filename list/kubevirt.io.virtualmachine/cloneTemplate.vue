<script>
import { HCI } from '@/config/types';
import { exceptionToErrorsArray } from '@/utils/error';
import { createNamespacedHelpers, mapGetters } from 'vuex';

import ModalWithCard from '@/components/ModalWithCard';
import LabeledInput from '@/components/form/LabeledInput';

const { mapState } = createNamespacedHelpers(HCI.VM);

export default {
  name: 'RestoreModal',

  components: { LabeledInput, ModalWithCard },

  data() {
    return {
      templateName: '',
      description:  '',
      errors:       []
    };
  },

  computed: {
    ...mapState(['actionResources', 'isShowCloneTemplate']),
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
    isShowCloneTemplate: {
      handler(show) {
        if (show) {
          this.$nextTick(() => {
            this.$modal.show('cloneVM-modal');
          });
        } else {
          this.$modal.hide('cloneVM-modal');
        }
      },
      immediate: true
    }
  },

  methods: {
    closeModal() {
      this.$store.commit('kubevirt.io.virtualmachine/toggleCloneTemplateModal');
      this.templateName = '';
      this.description = '';
      this.errors = [];
    },

    async saveRestore(buttonCb) {
      if (!this.templateName) {
        this.$set(this, 'errors', [this.t('harvester.vmPage.createTemplate.message.tip')]);
        buttonCb(false);

        return;
      }

      try {
        const res = await this.actionResources.doAction('createTemplate', { name: this.templateName, description: this.description }, {}, false);

        if (res._status === 200 || res._status === 204) {
          this.$notify({
            title:    this.t('harvester.notification.title.succeed'),
            message:  this.t('harvester.vmPage.createTemplate.message.success', { templateName: this.templateName }),
            type:     'success'
          });

          this.closeModal();
        } else {
          const error = res?.data || exceptionToErrorsArray(res) || res;

          this.$set(this, 'errors', [error]);
          buttonCb(false);
        }
      } catch (err) {
        const error = err?.data || exceptionToErrorsArray(err) || err;

        this.$set(this, 'errors', [error]);
      }
    }
  },
};
</script>

<template>
  <ModalWithCard
    ref="cloneVM-modal"
    name="cloneVM-modal"
    width="40%"
    :pivot-y="0.001"
    :errors="errors"
    @finish="saveRestore"
    @close="closeModal"
  >
    <template #title>
      {{ t('harvester.vmPage.createTemplate.title') }}
    </template>

    <template #content>
      <LabeledInput
        v-model="templateName"
        class="mb-20"
        :label="t('harvester.vmPage.createTemplate.fields.name')"
        required
      />

      <LabeledInput
        v-model="description"
        :label="t('harvester.vmPage.createTemplate.fields.description')"
      />
    </template>
  </ModalWithCard>
</template>
