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

    tags: {
      type:    Object,
      default: () => {}
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
    const t = store.getters['i18n/t'];

    return {
      kmsInfo:               {} as any,
      iamInfo:               {} as any,
      canReadKms:            false,
      supportedVersionRange,
      customServiceRole:     !!this.serviceRole && !!this.serviceRole.length,
      encryptSecrets:        false,
      loadingVersions:       false,
      loadingKms:            false,
      allKubernetesVersions: eksVersions as string[],
      serviceRoleOptions:    [{ value: false, label: t('eks.serviceRole.options.standard') }, { value: true, label: t('eks.serviceRole.options.custom') }],

    };
  },

  watch: {
    'config.region': {
      handler() {
        this.fetchKubernetesVersions();
        this.fetchKMSKeys();
      },
      immediate: true
    },

    'config.amazonCredentialSecret': {
      handler() {
        this.fetchKubernetesVersions();
        this.fetchKMSKeys();
      },
      immediate: true
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
          label-key="eks.version.label"
          :mode="mode"
          :loading="loadingVersions"
          :taggable="true"
          :searchable="true"
          data-testid="eks-version-dropdown"
          @input="$emit('update:kubernetesVersion', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label-key="eks.enableNetworkPolicy.label"
          :value="enableNetworkPolicy"
          :disabled="!isNewOrUnprovisioned"
          @input="$emit('update:enableNetworkPolicy', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label-key="eks.ebsCSIDriver.label"
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
          data-testid="eks-service-role-radio"
          :disabled="mode!=='create'"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-if="customServiceRole"
          :value="serviceRole"
          :mode="mode"
          :disabled="mode!=='create'"
          :options="eksRoles"
          option-label="RoleName"
          option-key="RoleId"
          label-key="eks.serviceRole.label"
          :loading="loadingIam"
          data-testid="eks-service-role-dropdown"
          @input="$emit('update:serviceRole', $event.RoleName)"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          v-model="encryptSecrets"
          :disabled="mode!=='create'"
          :mode="mode"
          label-key="eks.encryptSecrets.label"
          data-testid="eks-encrypt-secrets-checkbox"
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
          data-testid="eks-kms-dropdown"
          :disabled="mode!=='create'"
          @input="$emit('update:kmsKey', $event)"
        />
        <template v-else>
          <LabeledInput
            :value="kmsKey"
            :mode="mode"
            :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
            :tooltip="t('cluster.machineConfig.amazonEc2.kmsKey.text')"
            data-testid="eks-kms-input"
            :disabled="mode!=='create'"
            @input="$emit('update:kmsKey', $event)"
          />
        </template>
      </div>
    </div>

    <div class="col span-6">
      <KeyValue
        :value="tags"
        :mode="mode"
        :title="t('eks.tags.label')"
        :as-map="true"
        :read-allowed="false"
        @input="$emit('update:tags', $event)"
      >
        <template #title>
          <label class="text-label">{{ t('eks.tags.label') }}</label>
        </template>
      </KeyValue>
    </div>
  </div>
</template>
