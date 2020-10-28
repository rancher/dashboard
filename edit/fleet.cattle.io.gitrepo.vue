<script>
import { exceptionToErrorsArray } from '@/utils/error';
import { mapGetters } from 'vuex';
import { FLEET, SECRET } from '@/config/types';
import { FLEET as FLEET_LABELS } from '@/config/labels-annotations';
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
import { TYPES as SECRET_TYPES } from '@/models/secret';
import { base64Encode } from '@/utils/crypto';

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
    this.allClusters = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    this.allClusterGroups = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });

    let authSecret = '_none';

    if ( this.value.spec?.clientSecretName ) {
      authSecret = this.value.spec.clientSecretName;
    }

    this.authSecret = authSecret;
    this.updateTargets();
  },

  data() {
    const targetInfo = this.value.targetInfo;
    const targetCluster = targetInfo.cluster;
    const targetClusterGroup = targetInfo.clusterGroup;
    const targetAdvanced = targetInfo.advanced;

    const ref = ( this.value.spec?.revision ? 'revision' : 'branch' );
    const refValue = this.value.spec?.[ref] || '';

    let targetMode = targetInfo.mode;

    if (!this.value.id ) {
      targetMode = 'all';
    } else if ( targetMode === 'cluster' ) {
      targetMode = `cluster://${ targetCluster }`;
    } else if ( targetMode === 'clusterGroup' ) {
      targetMode = `group://${ targetClusterGroup }`;
    }

    return {
      allClusters:      [],
      allClusterGroups: [],
      allWorkspaces:    [],
      allSecrets:       [],

      authSecret: null,
      username:   null,
      password:   null,
      publicKey:  null,
      privateKey: null,

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
    ...mapGetters(['workspace']),

    isLocal() {
      return this.value.metadata.namespace === 'fleet-local';
    },

    targetOptions() {
      const out = [
        {
          label: 'No Clusters',
          value: 'none'
        },
        {
          label: 'All Clusters in the Workspace',
          value: 'all',
        },
        {
          label: 'Advanced',
          value: 'advanced'
        },
        { kind: 'divider', disabled: true },
      ];

      const clusters = this.allClusters
        .filter(x => x.metadata.namespace === this.value.metadata.namespace)
        .map((x) => {
          return { label: x.nameDisplay, value: `cluster://${ x.metadata.name }` };
        });

      if ( clusters.length ) {
        out.push({
          kind:     'title',
          label:    'Clusters',
          disabled: true,
        });

        out.push(...clusters);
      }

      const groups = this.allClusterGroups
        .filter(x => x.metadata.namespace === this.value.metadata.namespace)
        .map((x) => {
          return { label: x.nameDisplay, value: `group://${ x.metadata.name }` };
        });

      if ( groups.length ) {
        out.push({
          kind:     'title',
          label:    'Cluster Groups',
          disabled: true
        });

        out.push(...groups);
      }

      return out;
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

    secretChoices() {
      const types = [SECRET_TYPES.SSH, SECRET_TYPES.BASIC];

      const out = this.allSecrets
        .filter(x => x.metadata.namespace === this.value.metadata.namespace && types.includes(x._type) )
        .map((x) => {
          return {
            label: `${ x.metadata.name } (${ x._type === SECRET_TYPES.SSH ? 'SSH' : 'HTTP Basic' })`,
            value: x.metadata.name,
          };
        });

      if ( out.length ) {
        out.unshift({
          kind:     'title',
          label:    'Choose an existing secret:',
          disabled: true
        });
      }

      out.unshift({
        label: 'Create a SSH Key Secret',
        value: '_ssh',
      });

      out.unshift({
        label: 'Create a HTTP Basic Auth Secret',
        value: '_basic',
      });

      out.unshift({
        label: 'None',
        value: '_none',
      });

      return out;
    },
  },

  watch: {
    'value.metadata.namespace': 'updateTargets',
    targetMode:                 'updateTargets',
    targetCluster:              'updateTargets',
    targetClusterGroup:         'updateTargets',
    targetAdvanced:             'updateTargets',

    authSecret: 'updateAuth',

    workspace(neu) {
      if ( this.isCreate ) {
        set(this.value, 'metadata.namespace', neu);
      }
    },
  },

  created() {
    this.registerBeforeHook(this.createSecret);
  },

  methods: {
    set,

    updateAuth() {
      const spec = this.value.spec;

      if ( (this.authSecret || '').startsWith('_') ) {
        spec.clientSecretName = null;
      } else if ( this.authSecret ) {
        spec.clientSecretName = this.authSecret;
      }
    },

    async createSecret() {
      if ( this.authSecret === '_ssh' || this.authSecret === '_basic' ) {
        const secret = await this.$store.dispatch('management/create', {
          type:     SECRET,
          metadata: {
            namespace: this.value.metadata.namespace,
            name:      this.value.metadata.name
          },
        });

        if ( this.authSecret === '_ssh' ) {
          secret._type = SECRET_TYPES.SSH;
          secret.data = {
            'ssh-publickey':  base64Encode(this.publicKey),
            'ssh-privatekey': base64Encode(this.privateKey),
          };
        } else {
          secret._type = SECRET_TYPES.BASIC;
          secret.data = {
            username:  base64Encode(this.username),
            password: base64Encode(this.password),
          };
        }

        await secret.save();
        this.authSecret = secret.metadata.name;
      }
    },

    updateTargets() {
      const spec = this.value.spec;
      const mode = this.targetMode;

      let kind, value;
      const match = mode.match(/([^:]+)(:\/\/(.*))?$/);

      if ( match ) {
        kind = match[1];
        value = match[3];
      }

      if ( kind === 'all' ) {
        spec.targets = [{ clusterSelector: {} }];
      } else if ( kind === 'none' ) {
        spec.targets = [];
      } else if ( kind === 'cluster' ) {
        // const mgmt = this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, value);

        // if ( mgmt ) {
        //   mgmt.setClusterNameLabel(true);
        // }

        spec.targets = [
          { clusterSelector: { matchLabels: { [FLEET_LABELS.CLUSTER_NAME]: value } } }
        ];
      } else if ( kind === 'group' ) {
        spec.targets = [
          { clusterGroup: value }
        ];
      } else if ( kind === 'advanced' ) {
        try {
          const parsed = jsyaml.safeLoad(this.targetAdvanced);

          spec.targets = parsed;
          this.targetAdvancedErrors = null;
        } catch (e) {
          this.targetAdvancedErrors = exceptionToErrorsArray(e);
        }
      } else {
        spec.targets = [];
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
          v-model="authSecret"
          :mode="mode"
          :label="t('fleet.gitRepo.auth.label')"
          :options="secretChoices"
          :selectable="option => !option.disabled"
        >
          <template v-slot:option="opt">
            <template v-if="opt.kind === 'divider'">
              <hr />
            </template>
            <template v-else-if="opt.kind === 'title'">
              {{ opt.label }}
            </template>
            <template v-else>
              {{ opt.label }}
            </template>
          </template>
        </LabeledSelect>
      </div>
    </div>
    <div v-if="authSecret === '_ssh'" class="row mt-20">
      <div class="col span-6">
        <LabeledInput v-model="publicKey" type="multiline" label="Public Key" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="privateKey" type="multiline" label="Private Key" />
      </div>
    </div>
    <div v-if="authSecret === '_basic'" class="row mt-20">
      <div class="col span-6">
        <LabeledInput v-model="username" label="Username" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="password" type="password" label="Password" />
      </div>
    </div>

    <hr class="mt-20 mb-20" />

    <h2 v-t="'fleet.gitRepo.paths.label'" />
    <ArrayList
      v-model="value.spec.paths"
      :mode="mode"
      :initial-empty-row="false"
      :value-placeholder="t('fleet.gitRepo.paths.placeholder')"
      :add-label="t('fleet.gitRepo.paths.addLabel')"
    >
      <template #empty>
        <Banner label="The root of the repo is used by default.  To use one or more different directories, add them here." />
      </template>
    </ArrayList>

    <hr v-if="!isView" class="mt-20 mb-20" />

    <h2 v-t="isLocal ? 'fleet.gitRepo.target.labelLocal' : 'fleet.gitRepo.target.label'" />

    <template v-if="!isLocal">
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model="targetMode"
            :options="targetOptions"
            option-key="value"
            :mode="mode"
            :selectable="option => !option.disabled"
            :label="t('fleet.gitRepo.target.selectLabel')"
          >
            <template v-slot:option="opt">
              <hr v-if="opt.kind === 'divider'">
              <div v-else-if="opt.kind === 'title'">
                {{ opt.label }}
              </div>
              <div v-else>
                {{ opt.label }}
              </div>
            </template>
          </LabeledSelect>
        </div>
      </div>

      <div v-if="targetMode === 'advanced'" class="row mt-10">
        <div class="col span-12">
          <YamlEditor v-model="targetAdvanced" />
        </div>
      </div>

      <Banner v-for="(err, i) in targetAdvancedErrors" :key="i" color="error" :label="err" />
    </template>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.serviceAccount"
          label="Service Account Name"
          placeholder="Optional: Use a service account in the target clusters"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.targetNamespace"
          label="Target Namespace"
          placeholder="Optional: Require all resources to be in this namespace"
        />
      </div>
    </div>

    <hr class="mt-20" />

    <Labels
      default-section-class="mt-20"
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
    />
  </CruResource>
</template>
