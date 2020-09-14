<script>
import { exceptionToErrorsArray } from '@/utils/error';
import { FLEET, SECRET } from '@/config/types';
import { findBy } from '@/utils/array';
import { set } from '@/utils/object';
import ArrayList from '@/components/form/ArrayList';
import Banner from '@/components/Banner';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import InputWithSelect from '@/components/form/InputWithSelect';
import jsyaml from 'js-yaml';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import YamlEditor from '@/components/YamlEditor';
import { BASIC, SSH } from '@/models/secret';

export default {
  name: 'CruGitRepo',

  components: {
    ArrayList,
    Banner,
    CruResource,
    InputWithSelect,
    Labels,
    LabeledInput,
    LabeledSelect,
    Loading,
    NameNsDescription,
    YamlEditor,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.allWorkspaces = await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
    this.allClusters = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    this.allClusterGroups = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });

    const def = findBy(this.allWorkspaces, 'id', 'fleet-default');

    if ( def ) {
      this.value.metadata.namespace = def.id;
    } else {
      this.value.metadata.namespace = this.allWorkspaces[0]?.id;
    }

    let authMode = 'none';

    if ( this.value.spec?.clientSecretName ) {
      const secret = findBy(this.allSecrets, { id: `${ this.value.metadata.namespace }/${ this.value.spec.clientSecretName }` });

      if ( secret ) {
        if ( secret._type === SSH ) {
          authMode = 'ssh';
        } else if ( secret._type === BASIC ) {
          authMode = 'basic';
        } else {
          authMode = 'custom';
        }
      }
    }

    this.authMode = authMode;
  },

  data() {
    const targetInfo = this.value.targetInfo;
    const targetMode = targetInfo.mode;
    const targetCluster = targetInfo.cluster;
    const targetClusterGroup = targetInfo.clusterGroup;
    const targetAdvanced = targetInfo.advanced;

    const ref = ( this.value.spec?.revision ? 'revision' : 'branch' );
    const refValue = this.value.spec?.[ref] || '';

    return {
      allClusters:      null,
      allClusterGroups: null,
      allWorkspaces:    null,
      authMode:         null,

      ref,
      refValue,

      targetMode,
      targetCluster,
      targetClusterGroup,
      targetAdvanced,
      targetAdvancedErrors: null,

      matchingClusters: null,
    };
  },

  computed: {
    targetOptions() {
      const keys = ['cluster', 'clusterGroup', 'advanced'];

      return keys.map((k) => {
        return {
          label: this.t(`fleet.gitRepo.target.${ k }`),
          value: k
        };
      });
    },

    workspaceOptions() {
      return (this.allWorkspaces || []).map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id
        };
      });
    },

    clusterNames() {
      const out = this.allClusters
        .filter(x => x.metadata.namespace === this.value.metadata.namespace)
        .map(x => x.metadata.name);

      return out;
    },

    clusterGroupNames() {
      const out = this.allClusterGroups
        .filter(x => x.metadata.namespace === this.value.metadata.namespace)
        .map(x => x.metadata.name);

      return out;
    },

    authModeOptions() {
      const keys = ['none', 'ssh', 'basic'];

      if ( this.authMode === 'custom' ) {
        keys.push('custom');
      }

      return keys.map((k) => {
        return {
          label: this.t(`fleet.gitRepo.auth.${ k }`),
          value: k
        };
      });
    },

    sshKeyNames() {
      const out = this.allSecrets
        .filter(x => x.metadata.namespace === this.value.metadata.namespace && x._type === SSH)
        .map(x => x.metadata.name);

      return out;
    },

    basicAuthNames() {
      const out = this.allSecrets
        .filter(x => x.metadata.namespace === this.value.metadata.namespace && x._type === BASIC)
        .map(x => x.metadata.name);

      return out;
    },
  },

  watch: {
    'value.metadata.namespace': 'updateTargets',
    targetMode:                 'updateTargets',
    targetCluster:              'updateTargets',
    targetClusterGroup:         'updateTargets',
    targetAdvanced:             'updateTargets',

    authMode: 'updateAuth',
  },

  methods: {
    set,

    updateAuth() {
      if ( this.authMode === 'none' ) {
        this.value.spec.clientSecretName = null;
      }
    },

    updateTargets() {
      const spec = this.value.spec;

      if ( this.value.metadata.namespace === 'fleet-local' ) {
        if ( this.targetMode !== 'local' ) {
          this.targetMode = 'local';

          // You'll be back
          return;
        }
      } else if ( this.targetMode === 'local' ) {
        this.targetMode = 'cluster';

        // You'll be back
        return;
      }

      switch ( this.targetMode ) {
      case 'local':
        spec.targets = [];
        break;
      case 'cluster':
        spec.targets = [
          { clusterSelector: { matchLabels: { name: this.targetCluster } } }
        ];
        break;
      case 'clusterGroup':
        spec.targets = [
          { clusterGroup: this.targetClusterGroup }
        ];
        break;
      case 'advanced':
        try {
          const parsed = jsyaml.safeLoad(this.targetAdvanced);

          spec.targets = parsed;
          this.targetAdvancedErrors = null;
        } catch (e) {
          this.targetAdvancedErrors = exceptionToErrorsArray(e);
        }
        break;
      }
    },

    changeRef({ text, selected }) {
      this.ref = selected;
      this.refValue = text;
      const spec = this.value.spec;

      if ( selected === 'branch' ) {
        spec.branch = text;
        delete spec.revision;
      } else {
        delete spec.branch;
        spec.revision = text;
      }
    }
  }
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
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-if="!isView" v-model="value" :namespaced="false" :mode="mode" />

    <div class="row" :class="{'mt-20': isView}">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.repo"
          :mode="mode"
          :label="t('fleet.gitRepo.repo.label')"
          :placeholder="t('fleet.gitRepo.repo.placeholder', null, true)"
        />
      </div>
      <div class="col span-6">
        <InputWithSelect
          :mode="mode"
          :select-label="t('fleet.gitRepo.ref.label')"
          :select-value="ref"
          :text-label="t(`fleet.gitRepo.ref.${ref}Label`)"
          :text-placeholder="t(`fleet.gitRepo.ref.${ref}Placeholder`)"
          :text-value="refValue"
          :text-required="true"
          :options="[{label: t('fleet.gitRepo.ref.branch'), value: 'branch'}, {label: t('fleet.gitRepo.ref.revision'), value: 'revision'}]"
          @input="changeRef($event)"
        />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="authMode"
          :mode="mode"
          :label="t('fleet.gitRepo.auth.label')"
          :options="authModeOptions"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-if="authMode === 'ssh'"
          v-model="value.spec.clientSecretName"
          :mode="mode"
          :label="t('fleet.gitRepo.auth.custom')"
          :options="sshKeyNames"
        />
        <LabeledSelect
          v-else-if="authMode === 'basic'"
          v-model="value.spec.clientSecretName"
          :mode="mode"
          :label="t('fleet.gitRepo.auth.custom')"
          :options="basicAuthNames"
        />
        <LabeledInput
          v-else-if="authMode === 'custom'"
          v-model="value.spec.clientSecretName"
          :mode="mode"
          :label="t('fleet.gitRepo.auth.custom')"
        />
      </div>
    </div>

    <hr class="mt-20 mb-20" />

    <h2 v-t="'fleet.gitRepo.bundleDirs.label'" />
    <ArrayList
      v-model="value.spec.bundleDirs"
      :mode="mode"
      :initial-empty-row="true"
      :value-multiline="false"
      :value-placeholder="t('fleet.gitRepo.bundleDirs.placeholder')"
      :add-label="t('fleet.gitRepo.bundleDirs.addLabel')"
    />

    <hr v-if="!isView" class="mt-20 mb-20" />

    <h2 v-t="'fleet.gitRepo.target.label'" />

    <div class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="value.metadata.namespace"
          :mode="mode"
          :label="t('fleet.gitRepo.workspace.label')"
          :options="workspaceOptions"
        />
      </div>

      <div class="col span-4">
        <LabeledSelect
          v-if="targetMode !== 'local'"
          v-model="targetMode"
          :mode="mode"
          :label="t('fleet.gitRepo.target.selectLabel')"
          :options="targetOptions"
        />
      </div>

      <div class="col span-4">
        <LabeledSelect
          v-if="targetMode === 'cluster'"
          v-model="targetCluster"
          :mode="mode"
          :label="t('fleet.gitRepo.target.cluster')"
          :options="clusterNames"
        />
        <LabeledSelect
          v-else-if="targetMode === 'clusterGroup'"
          v-model="targetClusterGroup"
          :mode="mode"
          :label="t('fleet.gitRepo.target.clusterGroup')"
          :options="clusterGroupNames"
        />
      </div>
    </div>

    <div v-if="targetMode === 'advanced'" class="row mt-10">
      <div class="col span-12">
        <YamlEditor v-model="targetAdvanced" />
      </div>
    </div>

    <Banner v-for="(err, i) in targetAdvancedErrors" :key="i" color="error" :label="err" />

    <hr class="mt-20" />

    <Labels
      default-section-class="mt-20"
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
    />
  </CruResource>
</template>
