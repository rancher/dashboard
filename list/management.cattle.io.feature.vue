<script>
import { mapState, mapGetters } from 'vuex';
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Banner from '@/components/Banner';

export default {
  components: {
    AsyncButton,
    Banner,
    Card,
    Loading,
    ResourceTable
  },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    return {
      rows:       null,
      update:     [],
      updateMode: 'activate',
      error:      null,
      enabling:   false,
      restart:    false
    };
  },

  computed: {
    ...mapState('action-menu', ['showPromptUpdate', 'toUpdate']),
    ...mapGetters({ t: 'i18n/t' }),
  },

  watch: {
    showPromptUpdate(show) {
      if (show) {
        this.$modal.show('toggleFlag');
      } else {
        this.$modal.hide('toggleFlag');
      }
    },

    toUpdate(neu) {
      // Only support updating one at a time - bulk does not make sense, as they may
      // be in different states and with different restart values
      this.update = Array.isArray(neu) ? neu[0] : neu;
      if (this.update) {
        this.restart = this.update.restartRequired;
        // If the value is currently false, then we will be enabling it
        this.enabling = !this.update.enabled;
        this.updateMode = this.enabling ? 'activate' : 'deactivate';
      }
    }
  },

  methods: {
    close() {
      this.$store.commit('action-menu/togglePromptUpdate');
    },

    toggleFlag(btnCB) {
      this.doToggle(btnCB);
    },

    async doToggle(btnCB) {
      this.error = null;
      try {
        this.update.spec.value = !this.update.enabled;
        await this.update.save();
        btnCB(true);
        this.close();
      } catch (err) {
        this.error = err;
        btnCB(false);
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner color="warning" :label="t('featureFlags.warning')" />
    <ResourceTable :schema="schema" :rows="rows" />
    <modal
      class="update-modal"
      name="toggleFlag"
      :width="350"
      height="auto"
      styles="max-height: 100vh;"
      @closed="close"
    >
      <Card class="prompt-update" :show-highlight-border="false">
        <h4 slot="title" class="text-default-text">
          Are you sure?
        </h4>
        <div slot="body">
          <div v-if="update" class="mb-10">
            <span v-if="enabling">
              {{ t('featureFlags.promptActivate', {flag: update.id}) }}
            </span>
            <span v-else>
              {{ t('featureFlags.promptDeactivate', {flag: update.id}) }}
            </span>
            <Banner v-if="restart" color="warning" :label="t('featureFlags.restartRequired')" />
          </div>
          <div class="text-error mb-10">
            {{ error }}
          </div>
        </div>
        <template #actions>
          <button class="btn role-secondary" @click="close">
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton :mode="updateMode" class="btn bg-error ml-10" @click="toggleFlag" />
        </template>
      </Card>
    </modal>
  </div>
</template>

<style lang='scss' scoped>
  .prompt-update {
    &.card-container {
      box-shadow: none;
    }

    ::v-deep .card-actions {
      display: flex;
      justify-content: center;
    }
  }
</style>
