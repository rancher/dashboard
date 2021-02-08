<script>
import { exceptionToErrorsArray } from '@/utils/error';
import { mapGetters } from 'vuex';
import { FLEET } from '@/config/types';
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
import RadioGroup from '@/components/form/RadioGroup';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import YamlEditor from '@/components/YamlEditor';
import { base64Decode, base64Encode } from '@/utils/crypto';
import SelectOrCreateAuthSecret from '@/components/form/SelectOrCreateAuthSecret';
import { _CREATE } from '@/config/query-params';

const _VERIFY = 'verify';
const _SKIP = 'skip';
const _SPECIFY = 'specify';

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
    RadioGroup,
    SelectOrCreateAuthSecret,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.allClusters = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    this.allClusterGroups = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });

    let tls = _VERIFY;

    if ( this.value.spec.insecureSkipTLSVerify ) {
      tls = _SKIP;
    } else if ( this.value.spec.caBundle ) {
      try {
        this.caBundle = base64Decode(this.value.spec.caBundle);
        tls = _SPECIFY;
      } catch (e) {
        // Hmm...
      }
    }

    this.tlsMode = tls;

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

    if ( this.realMode === _CREATE ) {
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

      username:   null,
      password:   null,
      publicKey:  null,
      privateKey: null,
      tlsMode:    null,
      caBundle:   null,

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

    _SPECIFY() {
      return _SPECIFY;
    },

    isLocal() {
      return this.value.metadata.namespace === 'fleet-local';
    },

    isTls() {
      return !(this.value?.spec?.repo || '').startsWith('http://');
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
        .filter((x) => {
          return x.metadata.namespace === this.value.metadata.namespace;
        })
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

    tlsOptions() {
      return [
        { label: this.t('fleet.gitRepo.tls.verify'), value: _VERIFY },
        { label: this.t('fleet.gitRepo.tls.specify'), value: _SPECIFY },
        { label: this.t('fleet.gitRepo.tls.skip'), value: _SKIP },
      ];
    },
  },

  watch: {
    'value.metadata.namespace': 'updateTargets',
    targetMode:                 'updateTargets',
    targetCluster:              'updateTargets',
    targetClusterGroup:         'updateTargets',
    targetAdvanced:             'updateTargets',

    tlsMode:    'updateTls',
    caBundle:   'updateTls',

    workspace(neu) {
      if ( this.isCreate ) {
        set(this.value, 'metadata.namespace', neu);
      }
    },
  },

  methods: {
    set,

    updateAuth(val) {
      const spec = this.value.spec;

      if ( val ) {
        spec.clientSecretName = val;
      } else {
        delete spec.clientSecretName;
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
    },

    updateTls() {
      const spec = this.value.spec;

      if ( this.tlsMode === _SPECIFY ) {
        spec.insecureSkipTLSVerify = false;
        const caBundle = (this.caBundle || '').trim();

        if ( caBundle ) {
          spec.caBundle = base64Encode(`${ caBundle }\n`);
        } else {
          delete spec.caBundle;
        }
      } else {
        if ( this.tlsMode === _SKIP ) {
          spec.insecureSkipTLSVerify = true;
        } else {
          spec.insecureSkipTLSVerify = false;
        }

        if ( this.originalValue.caBundle ) {
          spec.caBundle = this.originalValue.caBundle;
        } else {
          delete spec.caBundle;
        }
      }
    },
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
          label-key="fleet.gitRepo.repo.label"
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

    <SelectOrCreateAuthSecret
      :value="value.spec.clientSecretName"
      :register-before-hook="registerBeforeHook"
      :namespace="value.metadata.namespace"
      in-store="management"
      generate-name="gitrepo-auth-"
      @input="updateAuth($event)"
    />

    <template v-if="isTls">
      <div class="spacer" />

      <h3 v-t="'fleet.gitRepo.tls.label'" />
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            v-model="tlsMode"
            name="tlsMode"
            :mode="mode"
            :options="tlsOptions"
          />
        </div>
        <div v-if="tlsMode === _SPECIFY" class="col span-6">
          <LabeledInput
            v-model="caBundle"
            type="multiline"
            label-key="fleet.gitRepo.caBundle.label"
            placeholder-key="fleet.gitRepo.caBundle.placeholder"
          />
        </div>
      </div>

      <div class="spacer" />

      <h2 v-t="'fleet.gitRepo.paths.label'" />
      <ArrayList
        v-model="value.spec.paths"
        :mode="mode"
        :initial-empty-row="false"
        :value-placeholder="t('fleet.gitRepo.paths.placeholder')"
        :add-label="t('fleet.gitRepo.paths.addLabel')"
      >
        <template #empty>
          <Banner label-key="fleet.gitRepo.paths.empty" />
        </template>
      </ArrayList>

      <div class="spacer" />

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
            label-key="fleet.gitRepo.serviceAccount.label"
            placeholder-key="fleet.gitRepo.serviceAccount.placeholder"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.targetNamespace"
            label-key="fleet.gitRepo.targetNamespace.label"
            placeholder-key="fleet.gitRepo.targetNamespace.placeholder"
            label="Target Namespace"
            placeholder="Optional: Require all resources to be in this namespace"
          />
        </div>
      </div>

      <div class="spacer" />

      <Labels
        :value="value"
        :mode="mode"
        :display-side-by-side="false"
      />
    </template>
  </CruResource>
</template>
