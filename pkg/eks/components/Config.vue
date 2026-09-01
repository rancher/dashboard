<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EKSConfig, AWS } from '../types';
import { _EDIT, _VIEW, _CREATE } from '@shell/config/query-params';
import semver from 'semver';
import { Store, mapGetters } from 'vuex';
import { sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';

import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Banner from '@components/Banner/Banner.vue';

import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import eksVersions from '../assets/data/eks-versions';

export default defineComponent({
  name: 'EKSConfig',

  emits: ['update:kmsKey', 'update:serviceRole', 'update:kubernetesVersion', 'update:enableNetworkPolicy', 'update:ebsCSIDriver', 'update:serviceRole', 'update:secretsEncryption', 'update:kmsKey', 'update:tags'],

  components: {
    LabeledSelect,
    RadioGroup,
    KeyValue,
    Checkbox,
    LabeledInput,
    Banner
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

    secretsEncryption: {
      type:    Boolean,
      default: false
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
      kmsKeys:               [] as AWS.KmsKey[],
      canReadKms:            false,
      supportedVersionRange,
      customServiceRole:     !!this.serviceRole && !!this.serviceRole.length,
      loadingVersions:       false,
      loadingKms:            false,
      allKubernetesVersions: eksVersions as string[],
      serviceRoleOptions:    [{ value: false, label: t('eks.serviceRole.options.standard') }, { value: true, label: t('eks.serviceRole.options.custom') }],

    };
  },

  watch: {
    'config.region': {
      handler() {
        if (this.mode !== _VIEW) {
          this.fetchKubernetesVersions();
          this.fetchKMSKeys();
        }
      },
      immediate: true
    },

    'config.amazonCredentialSecret': {
      handler() {
        if (this.mode !== _VIEW) {
          this.fetchKubernetesVersions();
          this.fetchKMSKeys();
        }
      },
      immediate: true
    },

    'secretsEncryption'(neu) {
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
          this.$emit('update:kubernetesVersion', neu[0].value);
        }
      },
      immediate: true
    },

  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    // the control plane k8s version can't be more than one minor version ahead of any node pools
    // verify that all nodepools are on the same version as the control plane before showing upgrade optiopns
    canUpgrade(): boolean {
      if (this.mode === _CREATE) {
        return true;
      }
      const nodeGroups = this.config?.nodeGroups || [];

      const needsUpgrade = nodeGroups.filter((group) => semver.gt(semver.coerce(this.originalVersion), semver.coerce(group.version)) || group._isUpgrading);

      return !needsUpgrade.length;
    },

    hasUpgradesAvailable() {
      return this.versionOptions.filter((opt) => !opt.disabled).length > 1;
    },

    versionOptions(): {value: string, label: string, sort?: string, disabled?:boolean}[] {
      return this.allKubernetesVersions.reduce((versions, v: string) => {
        const coerced = semver.coerce(v);

        if (this.supportedVersionRange && !semver.satisfies(coerced, this.supportedVersionRange)) {
          return versions;
        }
        if (!this.originalVersion) {
          versions.push({ value: v, label: v });
        } else if (semver.lte(semver.coerce(this.originalVersion), coerced)) {
          const withinOneMinor = semver.inc(semver.coerce(this.originalVersion), 'minor');

          if (semver.gt(coerced, withinOneMinor)) {
            versions.push({
              value: v, label: `${ v } ${ this.t('eks.version.upgradeWarning') }`, disabled: true
            });
          } else {
            versions.push({ value: v, label: v });
          }
        }

        // Generate sort field for each version
        versions.forEach((v) => {
          v.sort = sortable(v.value);
        });

        return sortBy(versions, 'sort', true);
      }, [] as {value: string, label: string, sort?: string, disabled?:boolean}[]);
    },

    kmsOptions(): string[] {
      return (this.kmsKeys || []).map((k) => k.KeyArn);
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
        const addons = await this.$store.dispatch('aws/depaginateList', { client: eksClient, cmd: 'describeAddonVersions' });

        if (!addons) {
          return;
        }
        this.allKubernetesVersions = addons.reduce((versions: string[], addon: AWS.EKSAddon) => {
          (addon?.addonVersions || []).forEach((addonVersion) => {
            (addonVersion?.compatibilities || []).forEach((c) => {
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
        this.kmsKeys = await this.$store.dispatch('aws/depaginateList', { client: kmsClient, cmd: 'listKeys' });

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
    <Banner
      v-if="!canUpgrade && hasUpgradesAvailable"
      color="info"
      label-key="eks.version.upgradeDisallowed"
      data-testid="eks-version-upgrade-disallowed-banner"
    />
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
          :disabled="!canUpgrade && hasUpgradesAvailable"
          @update:value="$emit('update:kubernetesVersion', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label-key="eks.enableNetworkPolicy.label"
          :value="enableNetworkPolicy"
          :disabled="!isNewOrUnprovisioned"
          @update:value="$emit('update:enableNetworkPolicy', $event)"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label-key="eks.ebsCSIDriver.label"
          :value="ebsCSIDriver"
          :disabled="!isNewOrUnprovisioned"
          @update:value="$emit('update:ebsCSIDriver', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model:value="customServiceRole"
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
          @update:value="$emit('update:serviceRole', $event.RoleName)"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          :value="secretsEncryption"
          :disabled="mode!=='create'"
          :mode="mode"
          label-key="eks.encryptSecrets.label"
          data-testid="eks-secrets-encryption-checkbox"
          @update:value="$emit('update:secretsEncryption', $event)"
        />
      </div>
    </div>
    <div
      v-if="secretsEncryption"
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
          @update:value="$emit('update:kmsKey', $event)"
        />
        <template v-else>
          <LabeledInput
            :value="kmsKey"
            :mode="mode"
            :label="t('cluster.machineConfig.amazonEc2.kmsKey.label')"
            :tooltip="t('cluster.machineConfig.amazonEc2.kmsKey.text')"
            data-testid="eks-kms-input"
            :disabled="mode!=='create'"
            @update:value="$emit('update:kmsKey', $event)"
          />
        </template>
      </div>
    </div>

    <div class="col span-6 mt-20">
      <KeyValue
        :value="tags"
        :mode="mode"
        :as-map="true"
        :read-allowed="false"
        @update:value="$emit('update:tags', $event)"
      >
        <template #title>
          <h3 v-t="'eks.tags.label'" />
        </template>
      </KeyValue>
    </div>
  </div>
</template>
