<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import UnitInput from '@shell/components/form/UnitInput';
import { _CREATE } from '@shell/config/query-params';
import { SECRET } from '@shell/config/types';

export default {
  components: {
    LabeledSelect, LabeledInput, RadioGroup, UnitInput
  },
  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  },
  async fetch() {
    const secrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });

    this.secrets = secrets.filter(s => s._type === TYPES.OPAQUE).map(s => s.id).sort();
  },
  data() {
    const canListStorageClasses = this.$store.getters['cluster/canList'](SECRET);
    const volumeTypeOptions = [
      {
        label: this.t('storageClass.outscale-bsu.volumeType.gp2'),
        value: 'gp2'
      },
      {
        label: this.t('storageClass.outscale-bsu.volumeType.io1'),
        value: 'io1'
      },
    ];

    const availabilityZoneOptions = [
      {
        label: this.t('storageClass.outscale-bsu.availabilityZone.automatic'),
        value: 'automatic'
      },
      {
        label: this.t('storageClass.outscale-bsu.availabilityZone.manual'),
        value: 'manual'
      }
    ];
    const encryptionOptions = [
      {
        label: this.t('storageClass.outscale-bsu.encryption.enabled'),
        value: 'true'
      },
      {
        label: this.t('storageClass.outscale-bsu.encryption.disabled'),
        value: 'false'
      }
    ];

    if (this.mode === _CREATE) {
      this.$set(this.value.parameters, 'type', this.value.parameters.type || volumeTypeOptions[0].value);
      this.$set(this.value.parameters, 'encrypted', this.value.parameters.encrypted || encryptionOptions[1].value);
      this.$set(this.value.parameters, 'iopsPerGB', this.value.parameters.iopsPerGB || '0');
    }

    return {
      volumeTypeOptions,
      availabilityZoneOptions,
      encryptionOptions,
      canListStorageClasses,
      secrets: []
    };
  },
  computed: {
    iopsPerGB: {
      get() {
        return Number.parseInt(this.value.parameters.iopsPerGB);
      },
      set(value) {
        this.$set(this.value.parameters, 'iopsPerGB', value.toString());
      }
    },
    keySize: {
      get() {
        return Number.parseInt(this.value.parameters['luks-key-size']);
      },
      set(value) {
        this.$set(this.value.parameters, 'luks-key-size', value);
      }
    },
    keySecrets: {
      set(value) {
        const secret = value.split('/', 2);

        this.$set(this.value.parameters, 'csi.storage.k8s.io/node-stage-secret-namespace', secret[0]);
        this.$set(this.value.parameters, 'csi.storage.k8s.io/node-stage-secret-name', secret[1]);
      }
    }
  }
};
</script>
<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.parameters.type"
          name="volumeType"
          :label="t('storageClass.outscale-bsu.volumeType.label')"
          :mode="mode"
          :options="volumeTypeOptions"
        />
        <UnitInput
          v-if="value.parameters.type === 'io1'"
          v-model="iopsPerGB"
          class="mt-10"
          :label="t('storageClass.outscale-bsu.volumeType.provisionedIops.label')"
          :suffix="t('storageClass.outscale-bsu.volumeType.provisionedIops.suffix')"
          :mode="mode"
        />
        <LabeledInput
          v-model="value.parameters['csi.storage.k8s.io/fstype']"
          class="mt-10"
          :placeholder="t('storageClass.outscale-bsu.filesystemType.placeholder')"
          :label="t('storageClass.outscale-bsu.filesystemType.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="value.parameters.encrypted"
          name="encryption"
          :label="t('storageClass.outscale-bsu.encryption.label')"
          :mode="mode"
          :options="encryptionOptions"
        />
        <LabeledSelect
          v-if="canListStorageClasses && value.parameters.encrypted === 'true'"
          v-model="keySecrets"
          :options="secrets"
          :label="t('storageClass.outscale-bsu.encryption.secret')"
        />
        <LabeledInput
          v-if="value.parameters.encrypted === 'true'"
          v-model="value.parameters['luks-cipher']"
          class="mt-10"
          :label="t('storageClass.outscale-bsu.encryption.luks-cipher')"
          :mode="mode"
        />
        <LabeledInput
          v-if="value.parameters.encrypted === 'true'"
          v-model="value.parameters['luks-hash']"
          class="mt-10"
          :label="t('storageClass.outscale-bsu.encryption.luks-hash')"
          :mode="mode"
        />
        <UnitInput
          v-if="value.parameters.encrypted === 'true'"
          v-model="keySize"
          class="mt-10"
          :label="t('storageClass.outscale-bsu.encryption.luks-key-size')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
