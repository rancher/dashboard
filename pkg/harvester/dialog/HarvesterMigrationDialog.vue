<script>
import { mapGetters } from 'vuex';

import { NODE } from '@shell/config/types';
import { HCI } from '../types';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';

import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: {
    AsyncButton, Banner, Card, LabeledSelect
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      nodeName: '',
      errors:   []
    };
  },

  computed:   {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },

    vmi() {
      const vmiResources = this.$store.getters['harvester/all'](HCI.VMI);
      const resource = vmiResources.find(VMI => VMI.id === this.actionResource?.id) || null;

      return resource;
    },

    nodeNameList() {
      const nodes = this.$store.getters['harvester/all'](NODE);

      return nodes.filter((n) => {
        // do not allow to migrate to self node
        return n.id !== this.vmi?.status?.nodeName && n.isMigratable;
      }).map((n) => {
        let label = n?.metadata?.name;
        const value = n?.metadata?.name;
        const custom = n?.metadata?.annotations?.[HCI_ANNOTATIONS.HOST_CUSTOM_NAME];

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

  methods: {
    close() {
      this.nodeName = '';
      this.errors = [];
      this.$emit('close');
    },

    async apply(buttonDone) {
      if (!this.actionResource) {
        buttonDone(false);

        return;
      }

      if (!this.nodeName) {
        const name = this.$store.getters['i18n/t']('harvester.modal.migration.fields.nodeName.label');
        const message = this.$store.getters['i18n/t']('validation.required', { key: name });

        this.$set(this, 'errors', [message]);
        buttonDone(false);

        return;
      }

      try {
        await this.actionResource.doAction('migrate', { nodeName: this.nodeName }, {}, false);

        buttonDone(true);
        this.close();
      } catch (err) {
        const error = err?.data || err;
        const message = exceptionToErrorsArray(error);

        this.$set(this, 'errors', message);
        buttonDone(false);
      }
    },

  }
};
</script>

<template>
  <Card :show-highlight-border="false">
    <template #title>
      {{ t('harvester.modal.migration.title') }}
    </template>

    <template #body>
      <LabeledSelect
        v-model="nodeName"
        :label="t('harvester.modal.migration.fields.nodeName.label')"
        :placeholder="t('harvester.modal.migration.fields.nodeName.placeholder')"
        :options="nodeNameList"
      />
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="apply"
          :disabled="!nodeName"
          @click="apply"
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
