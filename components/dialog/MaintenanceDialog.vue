<script>
import { mapGetters } from 'vuex';
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { errors: [] };
  },

  computed:   {
    ...mapGetters({ t: 'i18n/t' }),

    actionResource() {
      return this.resources[0];
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    apply(buttonDone) {
      this.errors = [];

      try {
        this.actionResource.doAction('enableMaintenanceMode', {});
        buttonDone(true);
        this.close();
      } catch (e) {
        this.errors = exceptionToErrorsArray(e);
        buttonDone(false);
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

    <div slot="actions">
      <button class="btn role-secondary" @click="close">
        {{ t('generic.cancel') }}
      </button>

      <AsyncButton
        mode="apply"
        @click="apply"
      />
    </div>
  </Card>
</template>
