<script>
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: { LabeledSelect },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const providers = [{
      label: 'Elasticsearch',
      value: 'elasticsearch'
    }];
    const provider = providers[0].value;

    this.value[this.providerKey(provider)].enabled = true;

    return {
      provider,
      providers
    };
  },

  computed: {
    component() {
      return require(`./providers/${ this.provider }`).default;
    }
  },

  watch: {
    provider(newValue, oldValue) {
      this.value[this.providerKey(newValue)].enabled = true;
      this.value[this.providerKey(oldValue)].enabled = false;
    }
  },

  methods: {
    providerKey(provider) {
      return provider.toLowerCase();
    }
  }
};
</script>

<template>
  <div class="logging">
    <LabeledSelect v-model="provider" class="provider" :label="t('logging.provider')" :options="providers" />
    <component :is="component" v-model="value" />
  </div>
</template>

<style lang="scss">
.logging {
  width: 60%;
  margin: 0 auto;

  .provider {
      margin-bottom: 20px;
  }
}
</style>
