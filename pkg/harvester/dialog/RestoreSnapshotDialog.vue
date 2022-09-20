<script>
import { mapGetters } from 'vuex';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { allHash } from '@shell/utils/promise';
import { STORAGE_CLASS } from '@shell/config/types';

export default {
  name:       'HarvesterRestoreSnapshotDialog',
  components: {
    AsyncButton,
    Banner,
    Card,
    LabeledInput,
    LabeledSelect,
  },
  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },
  data() {
    return {
      name:             '',
      errors:           [],
      storageClassName: '',
    };
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = { storages: this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS }) };

    await allHash(hash);

    if (this.showStorageClass) {
      const defaultStorage = this.$store.getters[`${ inStore }/all`](STORAGE_CLASS).find(s => s.isDefault);

      this.$set(this, 'storageClassName', defaultStorage?.metadata?.name || 'longhorn');
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    actionResource() {
      return this.resources[0] || {};
    },
    disableSave() {
      return !(this.name && (this.showStorageClass ? this.storageClassName : true));
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

    showStorageClass() {
      return this.actionResource?.volume?.source === 'data';
    },
  },
  methods: {
    close() {
      this.name = '';
      this.storageClassName = '';

      this.$emit('close');
    },
    async save(buttonCb) {
      try {
        const payload = { name: this.name };

        if (this.showStorageClass) {
          payload.storageClassName = this.storageClassName;
        }

        const res = await this.actionResource.doAction('restore', payload);

        if (res._status === 200 || res._status === 204) {
          this.$store.dispatch('growl/success', {
            title:   this.t('harvester.notification.title.succeed'),
            message: this.t('harvester.modal.restoreSnapshot.success', { name: this.name })
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
      {{ t('harvester.modal.restoreSnapshot.title') }}
    </template>
    <template #body>
      <LabeledInput
        v-model="name"
        :label="t('harvester.modal.restoreSnapshot.name')"
        required
      />
      <LabeledSelect
        v-if="showStorageClass"
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
