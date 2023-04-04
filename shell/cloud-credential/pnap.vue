<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import { base64Encode } from '@shell/utils/crypto';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  watch: {
    'value.decodedData.clientIdentifier'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.clientSecret'(neu) {
      this.$emit('validationChanged', !!neu);
    }
  },

  methods: {
    async test() {
      try {
        const credentials = `${ this.value.decodedData.clientIdentifier }:${ this.value.decodedData.clientSecret }`;
        const encoded = base64Encode(credentials);

        const requestOptions = {
          url:                  'meta/proxy/auth.phoenixnap.com/auth/realms/BMC/protocol/openid-connect/token/',
          method:               'POST',
          headers:              { 'Content-Type': 'application/x-www-form-urlencoded', 'X-API-Auth-Header': `Basic ${ encoded }` },
          data:                 'grant_type=client_credentials',
          redirectUnauthorized: false,
        };

        const response = await this.$store.dispatch('management/request', requestOptions);
        const data = await response;

        if (data.access_token !== undefined && data.access_token !== null && data.access_token !== '') {
          return true;
        }

        return false;
      } catch (e) {
        return false;
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.clientIdentifier"
          label-key="cluster.credential.pnap.clientIdentifier.label"
          placeholder-key="cluster.credential.pnap.clientIdentifier.placeholder"
          type="text"
          :mode="mode"
          @input="value.setData('clientIdentifier', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.clientSecret"
          label-key="cluster.credential.pnap.clientSecret.label"
          placeholder-key="cluster.credential.pnap.clientSecret.placeholder"
          type="text"
          :mode="mode"
          @input="value.setData('clientSecret', $event);"
        />
      </div>
    </div>
    <div class="row mt-5">
      <p
        v-clean-html="t('cluster.credential.pnap.clientSecret.help', {}, true)"
        class="text-muted mt-10"
      />
    </div>
  </div>
</template>
