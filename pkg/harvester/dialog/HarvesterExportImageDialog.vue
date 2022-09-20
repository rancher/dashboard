<script>
import { mapGetters } from 'vuex';
import { exceptionToErrorsArray } from '@shell/utils/error';

import { sortBy } from '@shell/utils/sort';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { NAMESPACE, STORAGE_CLASS } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

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

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = { storages: this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS }) };

    await allHash(hash);

    const defaultStorage = this.$store.getters[`${ inStore }/all`](STORAGE_CLASS).find(s => s.isDefault);

    this.$set(this, 'storageClassName', defaultStorage?.metadata?.name || 'longhorn');
  },

  data() {
    const namespace = this.$store.getters['defaultNamespace'] || '';

    return {
      name:             '',
      namespace,
      storageClassName: '',
      errors:           []
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
      return !(this.name && this.namespace && this.storageClassName);
    },

    storageClassOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const storages = this.$store.getters[`${ inStore }/all`](STORAGE_CLASS);

      const out = storages.filter(s => !s.parameters?.backingImage).map((s) => {
        const label = s.isDefault ? `${ s.name } (${ this.t('generic.default') })` : s.name;

        return {
          label,
          value: s.name,
        };
      }) || [];

      return out;
    },
  },

  methods: {
    close() {
      this.name = '';
      this.namespace = '';
      this.storageClassName = '';
      this.$emit('close');
    },

    async save(buttonCb) {
      try {
        const res = await this.actionResource.doAction('export', {
          displayName:      this.name,
          namespace:        this.namespace,
          storageClassName: this.storageClassName,
        });

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

      <LabeledSelect
        v-model="storageClassName"
        :options="storageClassOptions"
        :label="t('harvester.storage.storageClass.label')"
        class="mt-20"
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
