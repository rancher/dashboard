<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import { mapGetters } from 'vuex';
import {
  AUTH_TYPE, FLEET, NORMAN, SECRET, VIRTUAL_HARVESTER_PROVIDER
} from '@shell/config/types';
import { set } from '@shell/utils/object';
import ArrayList from '@shell/components/form/ArrayList';
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import jsyaml from 'js-yaml';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Labels from '@shell/components/form/Labels';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import YamlEditor from '@shell/components/YamlEditor';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { _CREATE } from '@shell/config/query-params';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { CAPI, CATALOG } from '@shell/config/labels-annotations';
import { SECRET_TYPES } from '@shell/config/secret';

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

    const stepRepoInfo = {
      name:           'stepRepoInfo',
      title:          this.t('fleet.gitRepo.add.steps.repoInfo.title'),
      label:          this.t('fleet.gitRepo.add.steps.repoInfo.label'),
      subtext:        this.t('fleet.gitRepo.add.steps.repoInfo.subtext'),
      descriptionKey: 'fleet.gitRepo.add.steps.repoInfo.description',
      ready:          false,
      weight:         30
    };

    const stepTargetInfo = {
      name:           'stepTargetInfo',
      title:          this.t('fleet.gitRepo.add.steps.targetInfo.title'),
      label:          this.t('fleet.gitRepo.add.steps.targetInfo.label'),
      subtext:        this.t('fleet.gitRepo.add.steps.targetInfo.subtext'),
      descriptionKey: 'fleet.gitRepo.steps.add.targetInfo.description',
      ready:          true,
      weight:         30
    };

    const addRepositorySteps = [stepRepoInfo, stepTargetInfo].sort((a, b) => (b.weight || 0) - (a.weight || 0));

    return {
      allClusters:          [],
      allClusterGroups:     [],
      allWorkspaces:        [],
      tempCachedValues:     {},
      username:             null,
      password:             null,
      publicKey:            null,
      privateKey:           null,
      tlsMode:              null,
      caBundle:             null,
      targetAdvancedErrors: null,
      matchingClusters:     null,
      ref,
      refValue,
      targetMode,
      targetCluster,
      targetClusterGroup,
      targetAdvanced,
      stepRepoInfo,
      stepTargetInfo,
      addRepositorySteps,
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
      ];

      const clusters = this.allClusters
        .filter((x) => {
          return x.metadata.namespace === this.value.metadata.namespace;
        })
        .filter(x => !isHarvesterCluster(x))
        .map((x) => {
          return { label: x.nameDisplay, value: `cluster://${ x.metadata.name }` };
        });

      if ( clusters.length ) {
        out.push({ kind: 'divider', disabled: true });
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
        out.push({ kind: 'divider', disabled: true });
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

    stepOneRequires() {
      return !!this.value.metadata.name && !!this.refValue;
    }

  },

  watch: {
    'value.metadata.namespace': 'updateTargets',
    targetMode:                 'updateTargets',
    targetCluster:              'updateTargets',
    targetClusterGroup:         'updateTargets',
    targetAdvanced:             'updateTargets',

    tlsMode:  'updateTls',
    caBundle: 'updateTls',

    workspace(neu) {
      if ( this.isCreate ) {
        set(this.value, 'metadata.namespace', neu);
      }
    },
  },

  created() {
    this.registerBeforeHook(this.cleanTLS, 'cleanTLS');
    this.registerBeforeHook(this.doCreateSecrets, `registerAuthSecrets${ new Date().getTime() }`, 99);
  },

  methods: {
    set,

    cleanTLS() {
      if (!this.isTls) {
        delete this.value.spec.insecureSkipTLSVerify;
        delete this.value.spec.caBundle;
      }
    },

    updateCachedAuthVal(val, key) {
      this.tempCachedValues[key] = typeof val === 'string' ? { selected: val } : { ...val };
    },

    updateAuth(val, key) {
      const spec = this.value.spec;

      if ( val ) {
        spec[key] = val;
      } else {
        delete spec[key];
      }

      this.updateCachedAuthVal(val, key);
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
        spec.targets = [{
          clusterSelector: {
            matchExpressions: [{
              key:      CAPI.PROVIDER,
              operator: 'NotIn',
              values:   [
                VIRTUAL_HARVESTER_PROVIDER
              ],
            }],
          },
        }];
      } else if ( kind === 'none' ) {
        spec.targets = [];
      } else if ( kind === 'cluster' ) {
        spec.targets = [
          { clusterName: value },
        ];
      } else if ( kind === 'group' ) {
        spec.targets = [
          { clusterGroup: value }
        ];
      } else if ( kind === 'advanced' ) {
        try {
          const parsed = jsyaml.load(this.targetAdvanced);

          spec.targets = parsed;
          this.targetAdvancedErrors = null;
        } catch (e) {
          this.targetAdvancedErrors = exceptionToErrorsArray(e);
        }
      } else {
        spec.targets = [];
      }

      this.stepOneReady();
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

      this.stepOneReady();
    },

    async doCreateSecrets() {
      if (this.tempCachedValues.clientSecretName) {
        await this.doCreate('clientSecretName', this.tempCachedValues.clientSecretName);
      }

      if (this.tempCachedValues.helmSecretName) {
        await this.doCreate('helmSecretName', this.tempCachedValues.helmSecretName);
      }
    },

    async doCreate(name, credentials) {
      const { selected, publicKey, privateKey } = credentials;

      if ( ![AUTH_TYPE._SSH, AUTH_TYPE._BASIC, AUTH_TYPE._S3].includes(selected) ) {
        return;
      }

      let secret;

      if ( selected === AUTH_TYPE._S3 ) {
        secret = await this.$store.dispatch(`rancher/create`, {
          type:               NORMAN.CLOUD_CREDENTIAL,
          s3credentialConfig: {
            accessKey: publicKey,
            secretKey: privateKey,
          },
        });
      } else {
        secret = await this.$store.dispatch(`${ CATALOG._MANAGEMENT }/create`, {
          type:     SECRET,
          metadata: {
            namespace:    this.value.metadata.namespace,
            generateName: 'auth-'
          },
        });

        let type, publicField, privateField;

        switch ( selected ) {
        case AUTH_TYPE._SSH:
          type = SECRET_TYPES.SSH;
          publicField = 'ssh-publickey';
          privateField = 'ssh-privatekey';
          break;
        case AUTH_TYPE._BASIC:
          type = SECRET_TYPES.BASIC;
          publicField = 'username';
          privateField = 'password';
          break;
        default:
          throw new Error('Unknown type');
        }

        secret._type = type;
        secret.data = {
          [publicField]:  base64Encode(publicKey),
          [privateField]: base64Encode(privateKey),
        };
      }

      await secret.save();

      await this.$nextTick(() => {
        this.updateAuth(secret.id, name);
      });

      return secret;
    },

    updateTlsMode(event) {
      this.tlsMode = event;
    },

    onUpdateRepoName() {
      this.stepOneReady();
    },

    stepOneReady() {
      this.$set(this.addRepositorySteps[0], 'ready', this.stepOneRequires);
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

        if ( this.liveValue.caBundle ) {
          spec.caBundle = this.liveValue.caBundle;
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
    :steps="addRepositorySteps"
    :edit-first-step="true"
    :finish-mode="'finish'"
    class="wizard"
    @cancel="done"
    @error="e=>errors = e"
    @finish="save"
  >
    <template #noticeBanner>
      <Banner
        v-if="isLocal && mode === 'create'"
        color="info"
      >
        {{ t('fleet.gitRepo.createLocalBanner') }}
      </Banner>
    </template>
    <template #stepRepoInfo>
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :namespaced="false"
        :mode="mode"
        @change="onUpdateRepoName"
      />

      <div
        class="row"
        :class="{'mt-20': isView}"
      >
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
        :delegate-create-to-parent="true"
        in-store="management"
        :pre-select="tempCachedValues.clientSecretName"
        :mode="mode"
        generate-name="gitrepo-auth-"
        label-key="fleet.gitRepo.auth.git"
        @input="updateAuth($event, 'clientSecretName')"
        @inputauthval="updateCachedAuthVal($event, 'clientSecretName')"
      />

      <SelectOrCreateAuthSecret
        :value="value.spec.helmSecretName"
        :register-before-hook="registerBeforeHook"
        :namespace="value.metadata.namespace"
        :delegate-create-to-parent="true"
        in-store="management"
        :mode="mode"
        generate-name="helmrepo-auth-"
        label-key="fleet.gitRepo.auth.helm"
        :pre-select="tempCachedValues.helmSecretName"
        @input="updateAuth($event, 'helmSecretName')"
        @inputauthval="updateCachedAuthVal($event, 'helmSecretName')"
      />

      <template v-if="isTls">
        <div class="spacer" />
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              :label="t('fleet.gitRepo.tls.label')"
              :mode="mode"
              :value="tlsMode"
              :options="tlsOptions"
              @input="updateTlsMode($event)"
            />
          </div>
          <div
            v-if="tlsMode === _SPECIFY"
            class="col span-6"
          >
            <LabeledInput
              v-model="caBundle"
              :mode="mode"
              type="multiline"
              label-key="fleet.gitRepo.caBundle.label"
              placeholder-key="fleet.gitRepo.caBundle.placeholder"
            />
          </div>
        </div>
      </template>
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
    </template>
    <template #stepTargetInfo>
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

        <div
          v-if="targetMode === 'advanced'"
          class="row mt-10"
        >
          <div class="col span-12">
            <YamlEditor v-model="targetAdvanced" />
          </div>
        </div>

        <Banner
          v-for="(err, i) in targetAdvancedErrors"
          :key="i"
          color="error"
          :label="err"
        />
      </template>

      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.serviceAccount"
            :mode="mode"
            label-key="fleet.gitRepo.serviceAccount.label"
            placeholder-key="fleet.gitRepo.serviceAccount.placeholder"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.targetNamespace"
            :mode="mode"
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
