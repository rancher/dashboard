<script>
import { mapGetters } from 'vuex';
import { exceptionToErrorsArray } from '@shell/utils/error';

import { sortBy } from '@shell/utils/sort';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { NAMESPACE } from '@shell/config/types';

export default {
  name: 'HarvesterExportImageDialog',

  components: {
    AsyncButton, Banner, Card, LabeledInput, LabeledSelect
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    const namespace = this.$store.getters['defaultNamespace'] || '';

    return {
      name:   '',
      namespace,
      errors: []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },

    namespaces() {
      const choices = this.$store.getters['harvester/all'](NAMESPACE).filter( N => !N.isSystem);

      const out = sortBy(
        choices.map((obj) => {
          return {
            label: obj.nameDisplay,
            value: obj.id,
          };
        }),
        'label'
      );

      return out;
    },

    disableSave() {
      return !(this.name && this.namespace);
    }
  },

  methods: {
    close() {
      this.name = '';
      this.namespace = '';
      this.$emit('close');
    },

    async save(buttonCb) {
      try {
        const res = await this.actionResource.doAction('export', { displayName: this.name, namespace: this.namespace });

        if (res._status === 200 || res._status === 204) {
          this.$store.dispatch('growl/success', {
            title:   this.t('generic.notification.title.succeed'),
            message: this.t('harvester.modal.exportImage.message.success', { name: this.name })
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
      {{ t('harvester.modal.exportImage.title') }}
    </template>

    <template #body>
      <LabeledSelect
        v-model="namespace"
        :label="t('harvester.modal.exportImage.namespace')"
        :options="namespaces"
        class="mb-20"
        required
      />

      <LabeledInput
        v-model="name"
        :label="t('harvester.modal.exportImage.name')"
        required
      />
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="create"
          :disabled="disableSave"
          @click="save"
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
