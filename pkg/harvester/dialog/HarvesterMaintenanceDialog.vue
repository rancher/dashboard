<script>
import { mapGetters } from 'vuex';
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { errors: [] };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async apply(buttonCb) {
      this.errors = [];

      try {
        await this.actionResource.doAction('enableMaintenanceMode', {});

        buttonCb(true);
        this.close();
      } catch (e) {
        const error = [e?.data] || exceptionToErrorsArray(e);

        this.errors = error;
        buttonCb(false);
      }
    }
  }
};
</script>

<template>
  <Card :show-highlight-border="false">
    <template #title>
      {{ t('harvester.host.enableMaintenance.title') }}
    </template>

    <template #body>
      <Banner color="warning" :label="t('harvester.host.enableMaintenance.protip')" class="mt-20" />
      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
    </template>

    <div slot="actions" class="actions">
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="apply"
          @click="apply"
        />
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
