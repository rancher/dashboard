<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import { mapGetters } from 'vuex';

import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  name: 'CloneTemplateModal',

  components: {
    AsyncButton, Banner, Card, LabeledInput
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      templateName: '',
      description:  '',
      errors:       []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },
  },

  methods: {
    close() {
      this.templateName = '';
      this.description = '';
      this.$emit('close');
    },

    async saveRestore(buttonCb) {
      try {
        const res = await this.actionResource.doAction('createTemplate', { name: this.templateName, description: this.description }, {}, false);

        if (res._status === 200 || res._status === 204) {
          this.$store.dispatch('growl/success', {
            title:   this.t('harvester.notification.title.succeed'),
            message: this.t('harvester.modal.createTemplate.message.success', { templateName: this.templateName })
          }, { root: true });

          this.close();
          buttonCb(true);
        } else {
          const error = [res?.data] || exceptionToErrorsArray(res);

          this.$set(this, 'errors', error);
          buttonCb(false);
        }
      } catch (err) {
        const error = err?.data || err;
        const message = exceptionToErrorsArray(error);

        this.$set(this, 'errors', message);
        buttonCb(false);
      }
    }
  },
};
</script>

<template>
  <Card :show-highlight-border="false">
    <template #title>
      {{ t('harvester.modal.createTemplate.title') }}
    </template>

    <template #body>
      <LabeledInput
        v-model="templateName"
        class="mb-20"
        :label="t('harvester.modal.createTemplate.name')"
        required
      />

      <LabeledInput
        v-model="description"
        :label="t('harvester.modal.createTemplate.description')"
      />
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="create"
          :disabled="!templateName"
          @click="saveRestore"
        />
      </div>

      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.actions {
  width: 100%;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
