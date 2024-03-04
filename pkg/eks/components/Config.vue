<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EKSConfig } from '../types';
import { _EDIT } from '@shell/config/query-params';
import semver from 'semver';
import { Store, mapGetters } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import eksVersions from '../assets/data/eks-versions';

export default defineComponent({
  name: 'EKSConfig',

  components: {
    LabeledSelect,
    RadioGroup,
    KeyValue,
    Checkbox,
    LabeledInput
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },
    isNewOrUnprovisioned: {
      type:    Boolean,
      default: true
    },

    loadingIam: {
      type:    Boolean,
      default: false
    },
    eksRoles: {
      type:    Array,
      default: () => []
    },
    kmsKey: {
      type:    String,
      default: ''
    },
    serviceRole: {
      type:    String,
      default: ''
    },
    kubernetesVersion: {
      type:    String,
      default: ''
    },
    enableNetworkPolicy: {
      type:    Boolean,
      default: false
    },
    ebsCSIDriver: {
      type:    Boolean,
      default: false
    },
    config: {
      type:     Object as PropType<EKSConfig>,
      required: true
    },

    originalVersion: {
      type:    String,
      default: ''
    }
  },

  data() {
    const store = this.$store as Store<any>;
    // This setting is used by RKE1 AKS GKE and EKS - rke2/k3s have a different mechanism for fetching supported versions
    const supportedVersionRange = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_SUPPORTED_K8S_VERSIONS)?.value;

    return {
      kmsInfo:               {} as any,
      iamInfo:               {} as any,
      canReadKms:            false,
      supportedVersionRange,
      // TODO nb defaults from config
      customServiceRole:     false,
      encryptSecrets:        false,
      loadingVersions:       false,
      loadingKms:            false,
      // TODO nb redo as dropdown with "create one for me(default)" as the first option
      serviceRoleOptions:    [{ value: false, label: 'Standard: A service role will be automatically created' }, { value: true, label: 'Custom: Choose from an existing service role' }],
      allKubernetesVersions: eksVersions as string[],

    };
  },

  watch: {
    'config.region'() {
      // TODO nb loading spinners
      this.fetchKubernetesVersions();
      this.fetchKMSKeys();
    },

    'config.amazonCredentialSecret'() {
      this.fetchKubernetesVersions();
      this.fetchKMSKeys();
    },
    'encryptSecrets'(neu) {
      if (!neu) {
        this.$emit('update:kmsKey', '');
      }
    },

    'customServiceRole'(neu) {
      if (!neu) {
        this.$emit('update:serviceRole', '');
      }
    },

    versionOptions: {
      handler(neu) {
        if (neu && neu.length && !this.kubernetesVersion) {
          this.$emit('update:kubernetesVersion', neu[0]);
        }
      },
      immediate: true
    },

  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    versionOptions(): string[] {
      return this.allKubernetesVersions.filter((v: string) => {
        const coerced = semver.coerce(v);

        if (this.supportedVersionRange && !semver.satisfies(coerced, this.supportedVersionRange)) {
          return false;
        }
        if (this.originalVersion && semver.gt(semver.coerce(this.originalVersion), coerced)) {
          return false;
        }

        return true;
      }).sort().reverse();
    },

    kmsOptions(): string[] {
      return (this.kmsInfo?.Keys || []).map((k) => k.KeyArn);
    }
  },

  methods: {
    // there is no api for fetching eks versions
    // fetch addons and look at which versions they support
    // this assumes that all k8s versions are compatible with at least one addon
    // TODO nb move to aws store
    async fetchKubernetesVersions() {
      if (!this.config.region || !this.config.amazonCredentialSecret) {
        return;
      }
      this.loadingVersions = true;
      try {
        const eksClient = await this.$store.dispatch('aws/eks', { region: this.config.region, cloudCredentialId: this.config.amazonCredentialSecret });

        const res = await eksClient.describeAddonVersions({});
        const addons = res?.addons;

        if (!addons) {
          return;
        }
        this.allKubernetesVersions = addons.reduce((versions: string[], addon: any) => {
          (addon?.addonVersions || []).forEach((addonVersion: any) => {
            (addonVersion?.compatibilities || []).forEach((c: any) => {
              if (!versions.includes(c.clusterVersion)) {
                versions.push(c.clusterVersion);
              }
            });
          });

          return versions;
        }, []);
      } catch (err) {
        // if the user doesn't have permission to describe addon versions swallow the error and use a fallback list of eks versions
      }

      this.loadingVersions = false;
    },

    // TODO nb move to aws store
    async fetchKMSKeys() {
      const { region, amazonCredentialSecret } = this.config;

      if (!region || !amazonCredentialSecret) {
        return;
      }
      this.loadingKms = true;
      const store = this.$store as Store<any>;
      const kmsClient = await store.dispatch('aws/kms', { region, cloudCredentialId: amazonCredentialSecret });

      try {
        this.kmsInfo = await kmsClient.listKeys({});
        this.canReadKms = true;
      } catch (e) {
        this.canReadKms = false;
      }
      this.loadingKms = false;
    },

  }
});

</script>

<template>
  <div>
    <div
      :style="{'display':'flex',
               'align-items':'center'}"
      class="row mb-10"
    >
      <div class="col span-6">
        <LabeledSelect
          :value="kubernetesVersion"
          :options="versionOptions"
          label="Kubernetes Version"
          :mode="mode"
          :loading="loadingVersions"
          @input="$emit('update:kubernetesVersion', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="Project Network Isolation"
          :value="enableNetworkPolicy"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:enableNetworkPolicy', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="Out of tree EBS CSI Driver"
          :value="ebsCSIDriver"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:ebsCSIDriver', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model="customServiceRole"
          :mode="mode"
          :options="serviceRoleOptions"
          name="serviceRoleMode"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-if="customServiceRole"
          :value="serviceRole"
          :mode="mode"
          :options="eksRoles"
          option-label="RoleName"
          option-key="RoleId"
          label="Service Role"
          :loading="loadingIam"
          @input="$emit('update:serviceRole', $event)"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          v-model="encryptSecrets"
          :mode="mode"
          label="Encrypt secrets with a KMS key"
        />
      </div>
    </div>
    <div
      v-if="encryptSecrets"
      class="row mb-10"
    >
      <div
        class="col span-6"
      >
        <LabeledSelect
          v-if="canReadKms"
          :value="kmsKey"
          :mode="mode"
          :options="kmsOptions"
          :loading="loadingKms"
          :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
          @input="$emit('update:kmsKey', $event)"
        />
        <template v-else>
          <LabeledInput
            :value="kmsKey"
            :mode="mode"
            :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
            :tooltip="t('cluster.machineConfig.amazonEc2.kmsKey.text')"
            @input="$emit('update:kmsKey', $event)"
          />
        </template>
      </div>
    </div>

    <div class="col span-6">
      <KeyValue
        v-model="config.tags"
        :mode="mode"
        title="Tags"
        :as-map="true"
        :read-allowed="false"
      >
        <template #title>
          <label class="text-label">Tags</label>
        </template>
      </KeyValue>
    </div>
  </div>
</template>
