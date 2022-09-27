<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import { HCI } from '../types';

export default {
  name: 'HarvesterVMSnapshotDialog',

  components: {
    AsyncButton,
    Card,
    LabeledInput,
    Banner
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      snapshotName:      '',
      snapshotNamespace: '',
      errors:            []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    }
  },

  methods: {
    close() {
      this.snapshotNamespace = '';
      this.snapshotName = '';
      this.$emit('close');
    },

    async save(buttonCb) {
      if (this.actionResource) {
        try {
          const snapshot = await this.$store.dispatch('harvester/create', {
            metadata: {
              name:            this.snapshotName,
              namespace:       this.actionResource.metadata.namespace,
              ownerReferences: this.getOwnerReferencesFromVM(this.actionResource)
            },
            spec: {
              source: {
                apiGroup: 'kubevirt.io',
                kind:     'VirtualMachine',
                name:     this.actionResource.metadata.name
              },
              type: 'snapshot'
            },
            type: HCI.BACKUP
          });

          await snapshot.save();

          this.$store.dispatch(
            'growl/success',
            {
              title:   this.t('generic.notification.title.succeed'),
              message: this.t('harvester.modal.vmSnapshot.success', { name: this.snapshotName })
            },
            { root: true }
          );

          this.close();

          buttonCb(true);
        } catch (err) {
          const error = err?.data || err;
          const message = exceptionToErrorsArray(error);

          this.$set(this, 'errors', message);
          buttonCb(false);
        }
      }
    },

    getOwnerReferencesFromVM(resource) {
      const name = resource.metadata.name;
      const kind = resource.kind;
      const apiVersion = 'kubevirt.io/v1';
      const uid = resource?.metadata?.uid;

      return [{
        name,
        kind,
        uid,
        apiVersion,
      }];
    },
  }
};
</script>

<template>
  <Card :show-highlight-border="false">
    <h4
      slot="title"
      class="text-default-text"
      v-html="t('harvester.modal.vmSnapshot.title')"
    />

    <template #body>
      <LabeledInput v-model="actionResource.metadata.namespace" :disabled="true" :label="t('generic.namespace')" />
      <LabeledInput v-model="snapshotName" class="mt-20" :label="t('generic.name')" required />
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton mode="create" :disabled="!snapshotName" @click="save" />
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
