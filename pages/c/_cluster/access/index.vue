<script>
/*
custom validators
check serviceport for example of vustom
write into models
*/

import { _CREATE, _EDIT } from '@/config/query-params';
import ManageAuth from '@/edit/auth/ManageAuth';
import ConfigureAuth from '@/edit/auth/ConfigureAuth';

export default {
  components: { ManageAuth, ConfigureAuth },

  async asyncData(ctx) {
    const { route, store } = ctx;

    const providers = await store.dispatch('rancher/findAll', {
      type: 'authConfig',
      opt:  { url: `/v3/authConfigs`, force: true }
    }, { root: true }).then((providers) => {
      return providers.filter(provider => provider.id !== 'local');
    });

    const enabledProvider = (providers.filter(provider => provider.enabled) || [])[0];

    return {
      mode: route.query.mode || _CREATE, providers, enabledProvider
    };
  },

  data() {
    return { chosenProvider: this.enabledProvider };
  },

  methods: {
    disabled() {
      this.mode = _CREATE;
      this.getProviders();
      this.chosenProvider = null;
      this.enabledProvider = null;
    },

    async getProviders() {
      this.providers = await this.$store.dispatch('rancher/findAll', {
        type: 'authConfig',
        opt:  { url: `/v3/authConfigs`, force: true }
      }, { root: true }).then((providers) => {
        return providers.filter(provider => provider.id !== 'local');
      });

      this.enabledProvider = (this.providers.filter(provider => provider.enabled) || [])[0];
    },

    goToEdit() {
      this.chosenProvider = this.enabledProvider;
      this.mode = _EDIT;
    }
  }

};
</script>

<template>
  <div>
    <ManageAuth v-if="enabledProvider && mode!=='edit'" :value="enabledProvider" @edit="goToEdit" @disabled="disabled" />
    <ConfigureAuth
      v-else
      v-model="chosenProvider"
      :mode="mode"
      :providers="providers"
      @finish="getProviders"
      @canceled="mode === enabledProvider ? 'view' : 'create'"
    />
  </div>
</template>
