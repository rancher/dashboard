<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import FleetPolicyServiceAccountsSection from '@shell/components/fleet/FleetPolicyServiceAccountsSection.vue';
import FleetPolicySourceSection from '@shell/components/fleet/FleetPolicySourceSection.vue';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { FLEET, SECRET, SERVICE_ACCOUNT } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { set } from '@shell/utils/object';

// GitRepo and HelmOp credentials are basic-auth or SSH secrets; the other secrets a workspace
// holds (helm releases, service account tokens) can never be referenced by a policy
const CREDENTIAL_SECRET_TYPES = [SECRET_TYPES.BASIC, SECRET_TYPES.SSH];

export default {
  name: 'CruFleetPolicy',

  inheritAttrs: false,

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
    }, this.$store);

    this.workspaces = hash.workspaces || [];

    // Every name select is taggable, so the form is usable before these land; awaiting them holds
    // the whole form behind the spinner while every secret in the cluster is fetched
    checkSchemasForFindAllHash({
      serviceAccounts: {
        inStoreType: 'management',
        type:        SERVICE_ACCOUNT
      },
      secrets: {
        inStoreType: 'management',
        type:        SECRET
      },
    }, this.$store).then((names) => {
      this.serviceAccounts = names.serviceAccounts || [];
      this.secrets = names.secrets || [];
    }).catch((e) => {
      this.errors = exceptionToErrorsArray(e);
    });
  },

  data() {
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
    // The form always binds to both sub-objects; empty ones are dropped again on save.
    // Defaults for a new policy come from the model, applied by ResourceDetail on create only.
    set(this.value, 'gitRepo', this.value.gitRepo || {});
    set(this.value, 'helmOp', this.value.helmOp || {});
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
      return this.namesInNamespace(this.secrets.filter((secret) => CREDENTIAL_SECRET_TYPES.includes(secret._type || secret.type)));
    },

    // Restricting to a set of names only means anything once at least one name is picked;
    // an empty allow-list would silently allow everything instead
    validationPassed() {
      const restrictions = [
        [this.restrictServiceAccounts, this.value.allowedServiceAccounts],
        [this.restrictGitRepoSecrets, this.value.gitRepo?.allowedClientSecretNames],
        [this.restrictHelmOpSecrets, this.value.helmOp?.allowedHelmSecretNames],
      ];

      return !!this.value.name && restrictions.every(([restricted, allowed]) => !restricted || !!allowed?.length);
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
    :yaml-modifiers="{ collapseEmptyObjects: true }"
    :validation-passed="validationPassed"
    :errors="errors"
    @error="e => errors = e"
    @finish="save"
    @cancel="done"
  >
    <div class="policy-form">
      <NameNsDescription
        :value="value"
        :mode="mode"
        :namespace-options="workspaceOptions"
        name-label="fleet.policy.name.label"
        :no-bottom-margin="true"
        data-testid="fleet-policy-name-ns-description"
      />
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
.policy-form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}
</style>
