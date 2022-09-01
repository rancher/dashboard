<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import { sortBy } from '@shell/utils/sort';
import { mapGetters } from 'vuex';
import { PVC } from '@shell/config/types';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'HotplugModal',

  components: {
    AsyncButton, Card, LabeledInput, LabeledSelect, Banner
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  async fetch() {
    this.allPVCs = await this.$store.dispatch('harvester/findAll', { type: PVC });
  },

  data() {
    return {
      diskName:   '',
      volumeName: '',
      errors:     [],
      allPVCs:    [],
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    PVCs() {
      return this.allPVCs.filter(P => this.actionResource.metadata.namespace === P.metadata.namespace) || [];
    },

    actionResource() {
      return this.resources[0];
    },

    volumeOption() {
      return sortBy(
        this.PVCs
          .filter( (pvc) => {
            if (!!pvc.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID]) {
              return false;
            }

            return !pvc.attachVM;
          })
          .map((pvc) => {
            return {
              label: pvc.metadata.name,
              value: pvc.metadata.name
            };
          }),
        'label'
      );
    },
  },

  methods: {
    close() {
      this.diskName = '';
      this.volumeName = '';
      this.$emit('close');
    },

    async save(buttonCb) {
      if (this.actionResource) {
        try {
          const res = await this.actionResource.doAction('addVolume', { volumeSourceName: this.volumeName, diskName: this.diskName }, {}, false);

          if (res._status === 200 || res._status === 204) {
            this.$store.dispatch('growl/success', {
              title:   this.t('generic.notification.title.succeed'),
              message: this.t('harvester.modal.hotplug.success', { diskName: this.diskName, vm: this.actionResource.nameDisplay })
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
  }
};
</script>

<template>
  <Card ref="modal" name="modal" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text" v-html="t('harvester.modal.hotplug.title')" />

    <template #body>
      <LabeledInput
        v-model="diskName"
        :label="t('generic.name')"
        required
      />

      <LabeledSelect
        v-model="volumeName"
        :label="t('harvester.fields.volume')"
        :options="volumeOption"
        class="mt-20"
        required
      />
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button type="button" class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="apply"
          :disabled="!diskName || !volumeName"
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
