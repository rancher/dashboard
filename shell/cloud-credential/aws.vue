<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: {
    Loading, LabeledInput, LabeledSelect
  },
  mixins: [CreateEditView],

  async fetch() {
    let cur = (this.value.decodedData.defaultRegion || '').toLowerCase();

    if ( !cur ) {
      cur = this.$store.getters['aws/defaultRegion'];
      this.value.setData('defaultRegion', cur);
    }

    this.knownRegions = await this.$store.dispatch('aws/defaultRegions');

    if ( !this.knownRegions.includes(cur) ) {
      this.knownRegions.unshift(cur);
    }
  },

  data() {
    return { knownRegions: null };
  },

  watch: {
    'value.decodedData.accessKey'(neu) {
      this.$emit('validationChanged', !!neu);
    },

    'value.decodedData.secretKey'(neu) {
      this.$emit('validationChanged', !!neu);
    },

    'value.decodedData.defaultRegion'(neu) {
      this.$emit('validationChanged', !!neu);
    },
  },

  methods: {
    async test() {
      try {
        const client = await this.$store.dispatch('aws/ec2', {
          region:    this.value.decodedData.defaultRegion || this.$store.getters['aws/defaultRegion'],
          accessKey: this.value.decodedData.accessKey,
          secretKey: this.value.decodedData.secretKey,
        });

        await client.describeRegions({});

        return true;
      } catch (e) {
        return false;
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" :delayed="true" />
  <div v-else>
    <LabeledInput
      :value="value.decodedData.accessKey"
      label-key="cluster.credential.aws.accessKey.label"
      placeholder-key="cluster.credential.aws.accessKey.placeholder"
      type="text"
      :mode="mode"
      @input="value.setData('accessKey', $event);"
    />
    <LabeledInput
      :value="value.decodedData.secretKey"
      class="mt-20"
      label-key="cluster.credential.aws.secretKey.label"
      placeholder-key="cluster.credential.aws.secretKey.placeholder"
      type="password"
      :mode="mode"
      @input="value.setData('secretKey', $event);"
    />
    <LabeledSelect
      :value="value.decodedData.defaultRegion"
      class="mt-20"
      label-key="cluster.credential.aws.defaultRegion.label"
      placeholder-key="cluster.credential.aws.defaultRegion.placeholder"
      :mode="mode"
      :taggable="true"
      :options="knownRegions"
      @input="value.setData('defaultRegion', $event);"
    />
    <p class="text-muted mt-5" v-html="t('cluster.credential.aws.defaultRegion.help', {}, true)" />
  </div>
</template>
