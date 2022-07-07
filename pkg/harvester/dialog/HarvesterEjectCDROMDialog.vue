<script>
import { mapGetters } from 'vuex';

import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { Checkbox } from '@components/Form/Checkbox';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  name: 'HarvesterEjectCDROMModal',

  components: {
    AsyncButton,
    Card,
    Checkbox,
    Banner
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    const allDisk = [];
    const disks = this.resources[0].spec.template.spec.domain.devices.disks;

    if (Array.isArray(disks)) {
      disks.forEach((D) => {
        if (D.cdrom) {
          allDisk.push({
            name:  D.name,
            value: false
          });
        }
      });
    }

    return {
      allDisk,
      errors:    [],
      diskNames: []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },

    isDeleteDisabled() {
      return this.diskNames.length === 0;
    }
  },

  methods: {
    updateNames(names) {
      this.diskNames = names;
    },

    async remove(buttonDone) {
      try {
        await this.actionResource.doAction('ejectCdRom', { diskNames: this.diskNames });
        this.close();
        buttonDone(true);
      } catch (err) {
        const error = err?.data || err;
        const message = exceptionToErrorsArray(error);

        this.$set(this, 'errors', message);
        buttonDone(false);
      }
    },

    close() {
      this.backupName = '';
      this.errors = [];
      this.$emit('close');
    }
  },

  watch: {
    allDisk: {
      handler(neu) {
        const diskNames = [];

        neu.forEach((D) => {
          if (D.value) {
            diskNames.push(D.name);
          }
        });

        this.$set(this, 'diskNames', diskNames);
      },
      deep: true
    }
  }
};
</script>

<template>
  <Card :show-highlight-border="false">
    <template #title>
      {{ t('harvester.modal.ejectCDROM.title') }}
    </template>

    <template #body>
      <span class="text-info mb-10">
        {{ t('harvester.modal.ejectCDROM.operationTip') }}
      </span>

      <div>
        <Checkbox
          v-for="disk in allDisk"
          :key="disk.name"
          v-model="disk.value"
          :label="disk.name"
        />
      </div>

      <Banner color="warning">
        <span>{{ t('harvester.modal.ejectCDROM.warnTip') }}</span>
      </Banner>
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="delete"
          :disabled="!diskNames.length"
          class="btn bg-error ml-10"
          @click="remove"
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
