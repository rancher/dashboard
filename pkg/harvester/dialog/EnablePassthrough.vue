<script>
import { HCI } from '../types';
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import { escapeHtml } from '@shell/utils/string';

export default {
  name: 'HarvesterEnablePassthrough',

  components: {
    AsyncButton,
    Card,
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {};
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    close() {
      this.$emit('close');
    },

    async save(buttonCb) {
      // isSingleProduct == this is a standalone Harvester cluster
      const isSingleProduct = this.$store.getters['isSingleProduct'];
      let userName = 'admin';

      // if this is imported Harvester, there may be users other than 'admin
      if (!isSingleProduct) {
        userName = this.$store.getters['auth/v3User']?.username;
      }

      for (let i = 0; i < this.resources.length; i++) {
        const actionResource = this.resources[i];
        const inStore = this.$store.getters['currentProduct'].inStore;
        const pt = await this.$store.dispatch(`${ inStore }/create`, {
          type:     HCI.PCI_CLAIM,
          metadata: {
            name:            actionResource.metadata.name,
            ownerReferences: [{
              apiVersion: 'devices.harvesterhci.io/v1beta1',
              kind:       'PCIDevice',
              name:       actionResource.metadata.name,
              uid:        actionResource.metadata.uid,
            }]
          },
          spec:     {
            address:  actionResource.status.address,
            nodeName:   actionResource.status.nodeName,
            userName
          }
        } );

        try {
          await pt.save();
          buttonCb(true);
          this.close();
        } catch (err) {
          this.$store.dispatch('growl/fromError', {
            title: this.t('harvester.pci.claimError', { name: escapeHtml(actionResource.metadata.name) }),
            err,
          }, { root: true });
          buttonCb(false);
        }
      }
    }
  }
};
</script>

<template>
  <Card :show-highlight-border="false">
    <h4
      slot="title"
      class="text-default-text"
      v-html="t('promptRemove.title')"
    />

    <template #body>
      {{ t('harvester.pci.enablePassthroughWarning') }}
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton mode="enable" @click="save" />
      </div>
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
