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

// A policy can only usefully name a credential a GitRepo or HelmOp is able to pick, so each list
// mirrors what the matching form offers: basic-auth and SSH for both, and for GitRepo also a
// GitHub App secret, which is stored as Opaque and told apart by its data keys
const GIT_CREDENTIAL_SECRET_TYPES = [SECRET_TYPES.BASIC, SECRET_TYPES.SSH, SECRET_TYPES.OPAQUE];
const HELM_CREDENTIAL_SECRET_TYPES = [SECRET_TYPES.BASIC, SECRET_TYPES.SSH];

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

    gitRepoSecretOptions() {
      return this.credentialOptions(GIT_CREDENTIAL_SECRET_TYPES, true);
    },

    helmOpSecretOptions() {
      return this.credentialOptions(HELM_CREDENTIAL_SECRET_TYPES, false);
    },

    gitRepoDefaultSecretAllowed() {
      return this.defaultAllowed(this.restrictGitRepoSecrets, this.value.gitRepo?.defaultClientSecretName, this.value.gitRepo?.allowedClientSecretNames);
    },

    helmOpDefaultSecretAllowed() {
      return this.defaultAllowed(this.restrictHelmOpSecrets, this.value.helmOp?.defaultHelmSecretName, this.value.helmOp?.allowedHelmSecretNames);
    },

    // Restricting to a set of names only means anything once at least one name is picked;
    // an empty allow-list would silently allow everything instead
    validationPassed() {
      const restrictions = [
        [this.restrictServiceAccounts, this.value.allowedServiceAccounts],
        [this.restrictGitRepoSecrets, this.value.gitRepo?.allowedClientSecretNames],
        [this.restrictHelmOpSecrets, this.value.helmOp?.allowedHelmSecretNames],
      ];

      return !!this.value.name &&
        this.gitRepoDefaultSecretAllowed &&
        this.helmOpDefaultSecretAllowed &&
        restrictions.every(([restricted, allowed]) => !restricted || !!allowed?.length);
    },
  },

  methods: {
    /**
     * Fleet applies a default before validating it, so a default outside the allow-list rejects
     * every resource that falls back to it.
     */
    defaultAllowed(restricted, defaultName, allowed) {
      return !restricted || !defaultName || (allowed || []).includes(defaultName);
    },

    namesInNamespace(resources) {
      return (resources || [])
        .filter((resource) => resource.metadata?.namespace === this.namespace)
        .map((resource) => resource.metadata?.name)
        .filter((name) => !!name)
        .sort();
    },

    /**
     * The credentials of the given types held in the policy's namespace, as options keeping the
     * secret name as their value: a policy stores names, while the label carries the type and
     * user the GitRepo and HelmOp forms show, so the same secret reads the same in all three.
     */
    credentialOptions(types, allowGithubApp) {
      return (this.secrets || [])
        .filter((secret) => secret.metadata?.namespace === this.namespace && !!secret.metadata?.name)
        .filter((secret) => types.includes(secret._type || secret.type))
        // GitHub App credentials are Opaque secrets, so keep only the Opaque ones holding their keys
        .filter((secret) => (secret._type || secret.type) !== SECRET_TYPES.OPAQUE || (allowGithubApp && secret.isGithubApp))
        .map((secret) => ({ label: this.credentialLabel(secret), value: secret.metadata.name }))
        .sort((a, b) => a.value.localeCompare(b.value));
    },

    credentialLabel(secret) {
      const name = secret.metadata?.name;
      const { subTypeDisplay } = secret;
      // The preview reads the secret's data, which a user may be allowed to list but not to read
      const dataPreview = secret.data ? secret.dataPreview : null;

      if (!subTypeDisplay) {
        return name;
      }

      return dataPreview ? `${ name } (${ subTypeDisplay }: ${ dataPreview })` : `${ name } (${ subTypeDisplay })`;
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
        :secret-options="gitRepoSecretOptions"
        :default-secret-allowed="gitRepoDefaultSecretAllowed"
      />
      <FleetPolicySourceSection
        v-model:restricted="restrictHelmOpSecrets"
        :value="value.helmOp"
        variant="helmOp"
        :mode="mode"
        :service-account-options="serviceAccountOptions"
        :secret-options="helmOpSecretOptions"
        :default-secret-allowed="helmOpDefaultSecretAllowed"
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
