<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledInput from '@shell/components/form/LabeledInput';
import { NORMAN } from '@shell/config/types';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  watch: {
    value: {
      deep: true,
      handler(neu) {
        this.$emit('validationChanged', !!neu);
      }
    }
  },

  methods: {
    async test() {
      // The vsphere apis require that an existing cloudCredentialId be passed in order to use the API.
      // We create a temporary credential and attempt to invoke one of the basic APIs to authenticate the user.
      // We then delete the temporary credential since the existing system will create one after we authenticate.
      const temporaryCredential = await this.$store.dispatch('rancher/create', {
        type:                          NORMAN.CLOUD_CREDENTIAL,
        vmwarevspherecredentialConfig: this.value.decodedData
      });

      try {
        await temporaryCredential.save();

        await this.$store.dispatch('management/request', {
          url:                  `/meta/vsphere/data-centers?cloudCredentialId=${ temporaryCredential.id }`,
          redirectUnauthorized: false,
        }, { root: true });
      } catch (ex) {
        return false;
      } finally {
        await temporaryCredential.remove();
      }

      return true;
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.vcenter"
          label-key="cluster.credential.vmwarevsphere.server.label"
          placeholder-key="cluster.credential.vmwarevsphere.server.placeholder"
          :required="true"
          :mode="mode"
          @input="value.setData('vcenter', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.vcenterPort"
          label-key="cluster.credential.vmwarevsphere.port.label"
          :required="true"
          type="number"
          min="1"
          max="65535"
          :mode="mode"
          @input="value.setData('vcenterPort', $event);"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.username"
          label-key="cluster.credential.vmwarevsphere.username.label"
          :required="true"
          :mode="mode"
          @input="value.setData('username', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.password"
          label-key="cluster.credential.vmwarevsphere.password.label"
          :required="true"
          type="password"
          :mode="mode"
          @input="value.setData('password', $event);"
        />
      </div>
    </div>
    <p class="text-muted">
      {{ t('cluster.credential.vmwarevsphere.note', {}, true) }}
    </p>
  </div>
</template>
