<script>
import { HCI } from '@/config/types';
import { createNamespacedHelpers, mapGetters } from 'vuex';

import ModalWithCard from '@/components/ModalWithCard';
import Banner from '@/components/Banner';
import CDROMS from './cdroms';
const { mapState } = createNamespacedHelpers(HCI.VM);

export default {
  name: 'EjectCDROMModal',

  components: {
    ModalWithCard, CDROMS, Banner
  },

  data() {
    return {
      errors:       [],
      diskNames:    []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    ...mapState(['actionResources', 'isShowEjectCDROM']),

    isDeleteDisabled() {
      return this.diskNames.length === 0;
    }
  },

  watch: {
    isShowEjectCDROM: {
      handler(show) {
        if (show) {
          this.$nextTick(() => {
            this.$modal.show('ejectCDROM-modal');
          });
        } else {
          this.$modal.hide('ejectCDROM-modal');
        }

        this.diskNames = [];
      },
      immediate: true
    }
  },

  methods: {
    updateNames(names) {
      this.diskNames = names;
    },

    async remove() {
      try {
        await this.actionResources.doAction('ejectCdRom', { diskNames: this.diskNames });
        this.close();
      } catch (err) {
        this.errors.push(err);
      }
    },

    close() {
      this.$store.commit('kubevirt.io.virtualmachine/toggleEjectCDROMModal');
      this.backupName = '';
      this.errors = [];
    },
  },
};
</script>

<template>
  <ModalWithCard
    ref="ejectCDROM-modal"
    name="ejectCDROM-modal"
    width="30%"
    :pivot-y="0.001"
    :errors="errors"
    @finish="remove"
    @close="close"
  >
    <template #title>
      {{ t('harvester.modal.ejectCDROM.title') }}
    </template>

    <template #content>
      <span class="text-info">
        {{ t('harvester.modal.ejectCDROM.operationTip') }}
      </span>
      <CDROMS v-model="actionResources" class="mt-15" @change="updateNames" />

      <Banner color="warning">
        <span>{{ t('harvester.modal.ejectCDROM.warnTip') }}</span>
      </Banner>
    </template>

    <template slot="footer">
      <div class="actions">
        <button class="btn role-secondary" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <button class="btn bg-primary ml-20" :disabled="isDeleteDisabled" @click="remove">
          {{ t('harvester.modal.ejectCDROM.delete') }}
        </button>
      </div>
    </template>
  </ModalWithCard>
</template>
