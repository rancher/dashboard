<script>
import { mapGetters } from 'vuex';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
export default {
  name:       'HarvesterSnapshotDialog',
  components: {
    AsyncButton, Banner, Card, LabeledInput
  },
  props: {
    resources: {
      type:     Array,
      required: true
    }
  },
  data() {
    return {
      name:   '',
      errors: []
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    actionResource() {
      return this.resources[0];
    },
    disableSave() {
      return !this.name;
    }
  },
  methods: {
    close() {
      this.name = '';
      this.$emit('close');
    },
    async save(buttonCb) {
      try {
        const res = await this.actionResource.doAction('snapshot', { name: this.name });

        if (res._status === 200 || res._status === 204) {
          this.$store.dispatch('growl/success', {
            title:   this.t('harvester.notification.title.succeed'),
            message: this.t('harvester.modal.snapshot.message.success', { name: this.name })
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
      {{ t('harvester.modal.snapshot.title') }}
    </template>
    <template #body>
      <LabeledInput
        v-model="name"
        :label="t('harvester.modal.snapshot.name')"
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
