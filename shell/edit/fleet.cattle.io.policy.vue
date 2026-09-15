<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import FleetPolicyServiceAccountsSection from '@shell/components/fleet/FleetPolicyServiceAccountsSection.vue';
import FleetPolicySourceSection from '@shell/components/fleet/FleetPolicySourceSection.vue';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { FLEET, SECRET, SERVICE_ACCOUNT } from '@shell/config/types';
import { set } from '@shell/utils/object';

export default {
  name: 'CruFleetPolicy',

  inheritAttrs: false,

  emits: ['input'],

  components: {
    CruResource,
    Loading,
    NameNsDescription,
    FleetPolicyServiceAccountsSection,
    FleetPolicySourceSection,
  },

  mixins: [CreateEditView],

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
      workspaces: {
        inStoreType: 'management',
        type:        FLEET.WORKSPACE
      },
      serviceAccounts: {
        inStoreType: 'management',
        type:        SERVICE_ACCOUNT
      },
      secrets: {
        inStoreType: 'management',
        type:        SECRET
      },
    }, this.$store);

    this.workspaces = hash.workspaces || [];
    this.serviceAccounts = hash.serviceAccounts || [];
    this.secrets = hash.secrets || [];
  },

  data() {
    // The form always binds to both sub-objects; empty ones are dropped again on save
    set(this.value, 'gitRepo', this.value.gitRepo || {});
    set(this.value, 'helmOp', this.value.helmOp || {});

    return {
      workspaces:              [],
      serviceAccounts:         [],
      secrets:                 [],
      restrictServiceAccounts: !!this.value.allowedServiceAccounts?.length,
      restrictGitRepoSecrets:  !!this.value.gitRepo?.allowedClientSecretNames?.length,
      restrictHelmOpSecrets:   !!this.value.helmOp?.allowedHelmSecretNames?.length,
    };
  },

  created() {
    this.value.applyDefaults?.();
  },

  computed: {
    namespace() {
      return this.value?.metadata?.namespace;
    },

    workspaceOptions() {
      return (this.workspaces || []).map((workspace) => workspace.id).sort();
    },

    serviceAccountOptions() {
      return this.namesInNamespace(this.serviceAccounts);
    },

    secretOptions() {
      return this.namesInNamespace(this.secrets);
    },

    // Restricting to a set of names only means anything once at least one name is picked;
    // an empty allow-list would silently allow everything instead
    validationPassed() {
      const restrictions = [
        [this.restrictServiceAccounts, this.value.allowedServiceAccounts],
        [this.restrictGitRepoSecrets, this.value.gitRepo?.allowedClientSecretNames],
        [this.restrictHelmOpSecrets, this.value.helmOp?.allowedHelmSecretNames],
      ];

      return restrictions.every(([restricted, allowed]) => !restricted || !!allowed?.length);
    },
  },

  methods: {
    namesInNamespace(resources) {
      return (resources || [])
        .filter((resource) => resource.metadata?.namespace === this.namespace)
        .map((resource) => resource.metadata?.name)
        .filter((name) => !!name)
        .sort();
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="validationPassed"
    :errors="errors"
    @error="e => errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :namespace-options="workspaceOptions"
      name-label="fleet.policy.name.label"
      data-testid="fleet-policy-name-ns-description"
      @update:value="$emit('input', $event)"
    />
    <div class="policy-sections">
      <FleetPolicyServiceAccountsSection
        v-model:restricted="restrictServiceAccounts"
        :value="value"
        :mode="mode"
        :service-account-options="serviceAccountOptions"
      />
      <FleetPolicySourceSection
        v-model:restricted="restrictGitRepoSecrets"
        :value="value.gitRepo"
        variant="gitRepo"
        :mode="mode"
        :service-account-options="serviceAccountOptions"
        :secret-options="secretOptions"
      />
      <FleetPolicySourceSection
        v-model:restricted="restrictHelmOpSecrets"
        :value="value.helmOp"
        variant="helmOp"
        :mode="mode"
        :service-account-options="serviceAccountOptions"
        :secret-options="secretOptions"
      />
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
.policy-sections {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}
</style>
