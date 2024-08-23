<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  }
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.quobyteAPIServer"
          :placeholder="t('storageClass.quobyte.quobyteApiServer.placeholder')"
          :label="t('storageClass.quobyte.quobyteApiServer.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.registry"
          :placeholder="t('storageClass.quobyte.registry.placeholder')"
          :label="t('storageClass.quobyte.registry.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.adminSecretNamespace"
          :placeholder="t('storageClass.quobyte.adminSecretNamespace.placeholder')"
          :label="t('storageClass.quobyte.adminSecretNamespace.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.adminSecretName"
          :placeholder="t('storageClass.quobyte.adminSecretName.placeholder')"
          :label="t('storageClass.quobyte.adminSecretName.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.user"
          :placeholder="t('storageClass.quobyte.user.placeholder')"
          :label="t('storageClass.quobyte.user.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.group"
          :placeholder="t('storageClass.quobyte.group.placeholder')"
          :label="t('storageClass.quobyte.group.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.quobyteConfig"
          :placeholder="t('storageClass.quobyte.quobyteConfig.placeholder')"
          :label="t('storageClass.quobyte.quobyteConfig.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.quobyteTenant"
          :placeholder="t('storageClass.quobyte.quobyteTenant.placeholder')"
          :label="t('storageClass.quobyte.quobyteTenant.label')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
