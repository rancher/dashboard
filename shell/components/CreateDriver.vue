<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayList from '@shell/components/form/ArrayList';
export default {
  name: 'DriverCreate',

  components: {
    LabeledInput,
    ArrayList
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    rules: {
      default: () => ({
        url:              [],
        uiUrl:            [],
        checksum:         [],
        whitelistDomains: []
      }),
      type: Object,
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <LabeledInput
        v-model:value.trim="value.url"
        :label="t('drivers.add.downloadUrl.label')"
        :placeholder="t('drivers.add.downloadUrl.placeholder', null, true)"
        :tooltip="t('drivers.add.downloadUrl.tooltip', null, true)"
        :mode="mode"
        :rules="rules.url"
        :data-testid="'driver-create-url-field'"
        required
      />
    </div>
    <div class="row mb-20">
      <LabeledInput
        v-model:value.trim="value.checksum"
        :label="t('drivers.add.checksum.label')"
        :tooltip="t('drivers.add.checksum.tooltip', null, true)"
        :mode="mode"
        :rules="rules.checksum"
        :data-testid="'driver-create-checksum-field'"
      />
    </div>
    <div class="row mb-20">
      <LabeledInput
        v-model:value.trim="value.uiUrl"
        :label="t('drivers.add.customUiUrl.label')"
        :tooltip="t('drivers.add.customUiUrl.tooltip', null, true)"
        :placeholder="t('drivers.add.customUiUrl.placeholder', null, true)"
        :mode="mode"
        :rules="rules.uiUrl"
        :data-testid="'driver-create-uiurl-field'"
      />
    </div>
    <div class="col span-6">
      <ArrayList
        v-model:value="value.whitelistDomains"
        :protip="false"
        :mode="mode"
        :title="t('drivers.add.whitelist')"
        :rules="rules.whitelistDomains"
        :data-testid="'driver-create-whitelist-list'"
      />
    </div>
  </div>
</template>
