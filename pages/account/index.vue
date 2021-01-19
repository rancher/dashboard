<script>
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';
import ResourceTable from '@/components/ResourceTable';

export default {

  components: {
    Loading,
    ResourceTable,
  },

  async fetch() {
    this.rows = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.TOKEN, opt: { force: true } });
  },

  data() {
    return { rows: null };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    schema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/schemaFor`](MANAGEMENT.TOKEN);
    },

    apiKeys() {
      // Filter out tokens that are not API Keys
      const isApiKey = (key) => {
        const labels = key.metadata?.labels;
        const kind = labels ? labels['authn.management.cattle.io/kind'] : '';

        // Note: The ember ui looked for the label 'ui-session' - with Steve, this seems to npw
        // be the label 'authn.management.cattle.io/kind'' with the value 'session

        // TODO: Don't understand the Ember logic:
        // return  ( !expired || !labels || !labels['ui-session'] ) && !current;
        // For the Steve API, current always seems to be false, even for the current UI Session token
        // Show the Token if is not a session token and its it not current
        return kind !== 'session' && !key.current;
      };

      return !this.rows ? [] : this.rows.filter(isApiKey);
    },
  },

  methods: {
    addKey() {
      this.$router.push({ path: 'account/create-key' });
    },
  },

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <header>
      <div class="title">
        <h1 v-t="'account.apiKeys.title'" class="m-0"></h1>
      </div>
      <div class="actions-container">
        <div class="actions">
          <button class="btn role-primary" @click="addKey">
            {{ t('account.apiKeys.add.label') }}
          </button>
        </div>
      </div>
    </header>
    <ResourceTable
      :schema="schema"
      :rows="apiKeys"
      :headers="headers"
      key-field="id"
      :search="false"
      :row-actions="true"
      :table-actions="true"
    />
  </div>
</template>

<style lang="scss" scoped>
  hr {
    margin: 20px 0;
  }
</style>
