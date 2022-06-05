<script>
import { mapGetters } from 'vuex';

import { randomStr } from '@shell/utils/string';
import { HCI } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { exceptionToErrorsArray } from '@shell/utils/error';

import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'RestoreModal',

  components: {
    AsyncButton, Banner, Card, LabeledSelect
  },

  async fetch() {
    const hash = await allHash({ backups: this.$store.dispatch('harvester/findAll', { type: HCI.BACKUP }) });

    this.backups = hash.backups;
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      backups:    [],
      backupName: '',
      errors:     []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },

    backupOption() {
      const attachBackup = this.backups.filter( (B) => {
        return B.attachVM === this.actionResource?.metadata?.name;
      });

      return attachBackup.map( (O) => {
        return {
          value: O.metadata.name,
          label: O.metadata.name
        };
      });
    },
  },

  methods: {
    close() {
      this.backupName = '';
      this.errors = [];
      this.$emit('close');
    },

    async saveRestore(buttonCb) {
      const name = `restore-${ this.backupName }-${ randomStr(5).toLowerCase() }`;

      if (!this.backupName) {
        this.$set(this, 'errors', [this.t('harvester.modal.restore.message.backup')]);
        buttonCb(false);

        return;
      }

      try {
        const res = await this.actionResource.doAction('restore', { backupName: this.backupName, name }, {}, false);

        if (res._status === 200 || res._status === 204) {
          this.$store.dispatch('growl/success', {
            title:   this.t('harvester.notification.title.succeed'),
            message: this.t('harvester.modal.restore.success', { name: this.backupName })
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
      {{ t('harvester.modal.restore.title') }}
    </template>

    <template #body>
      <LabeledSelect
        v-model="backupName"
        :label="t('harvester.modal.restore.selectBackup')"
        :localized-label="true"
        :options="backupOption"
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
          :disabled="!backupName"
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
