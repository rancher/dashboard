<script>
import { allHash } from '@shell/utils/promise';
import { INGRESS_CLASS } from '@shell/config/types';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Error from '@shell/components/form/Error';
import Tabbed from '@shell/components/Tabbed';
import { get, set } from '@shell/utils/object';
import DefaultBackend from './DefaultBackend';
import Certificates from './Certificates';
import Rules from './Rules';
import IngressClass from './IngressClass';
import Loading from '@shell/components/Loading';
import IngressDetailEditHelper from '@shell/utils/ingress';

export default {
  name:         'CRUIngress',
  emits:        ['input'],
  inheritAttrs: false,
  components:   {
    IngressClass,
    Certificates,
    CruResource,
    DefaultBackend,
    Labels,
    NameNsDescription,
    Rules,
    Tab,
    Tabbed,
    Error,
    Loading,
  },
  mixins: [CreateEditView, FormValidation],
  props:  {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'edit'
    }
  },

  async fetch() {
    this.ingressHelper = new IngressDetailEditHelper({
      $store:    this.$store,
      namespace: this.value.metadata.namespace
    });

    this.ingressClassSchema = this.$store.getters[`cluster/schemaFor`](INGRESS_CLASS);

    const promises = {
      secrets:               this.ingressHelper.fetchSecrets(),
      services:              this.ingressHelper.fetchServices(),
      ingressClasses:        this.ingressClassSchema ? this.$store.dispatch('cluster/findAll', { type: INGRESS_CLASS }) : Promise.resolve([]),
      ingressResourceFields: this.schema.fetchResourceFields(),
    };

    const hash = await allHash(promises);

    this.secrets = hash.secrets;
    this.services = hash.services;
    this.allIngressClasses = hash.ingressClasses;
  },
  data() {
    return {
      filterByApi:        null,
      ingressClassSchema: null,
      secrets:            [],
      services:           [],
      allIngressClasses:  [],
      fvFormRuleSets:     [
        {
          path: 'metadata.name', rules: ['required', 'hostname'], translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'spec.rules.host', rules: ['wildcardHostname'], translationKey: 'ingress.rules.requestHost.label'
        },
        {
          path: 'spec.rules.http.paths.path', rules: ['absolutePath'], translationKey: 'ingress.rules.path.label'
        },
        {
          path: 'spec.rules.http.paths.backend.service.port.number', rules: ['required'], translationKey: 'ingress.rules.port.label'
        },
        {
          path: 'spec.rules.http.paths.backend.service.name', rules: ['required'], translationKey: 'ingress.rules.target.label'
        },
        { path: 'spec', rules: ['backEndOrRules'] },
        {
          path: 'spec.defaultBackend.service.name', rules: ['required'], translationKey: 'ingress.defaultBackend.targetService.label'
        },
        {
          path: 'spec.defaultBackend.service.port.number', rules: ['required', 'requiredInt', 'portNumber'], translationKey: 'ingress.defaultBackend.port.label'
        },
        { path: 'spec.tls.hosts', rules: ['required', 'wildcardHostname'] }
      ],
      fvReportedValidationPaths: ['spec.rules.http.paths.backend.service.port.number', 'spec.rules.http.paths.path', 'spec.rules.http.paths.backend.service.name']
    };
  },

  watch: {
    async 'value.metadata.namespace'(neu) {
      this.services = await this.ingressHelper.fetchServices({ namespace: neu });
      this.secrets = await this.ingressHelper.fetchSecrets({ namespace: neu });
    }
  },

  computed: {
    fvExtraRules() {
      const backEndOrRules = (spec) => {
        const { rules = [], defaultBackend } = spec;

        const validRules = rules.length > 0;
        const validDefaultBackend = !!defaultBackend?.service;

        if (!validRules && !validDefaultBackend) {
          return this.t('ingress.rulesOrBackendSpecified');
        }
      };

      return { backEndOrRules };
    },
    tabErrors() {
      return {
        rules:          this.fvGetPathErrors(['spec.rules.host', 'spec.rules.http.paths.path', 'spec.rules.http.paths.backend.service.port.number', 'spec.rules.http.paths.backend.service.name'])?.length > 0,
        defaultBackend: this.fvGetPathErrors(['spec.defaultBackend.service.name', 'spec.defaultBackend.service.port.number'])?.length > 0
      };
    },
    rulesPathRules() {
      return {
        requestHost: this.fvGetAndReportPathRules('spec.rules.host'),
        path:        this.fvGetAndReportPathRules('spec.rules.http.paths.path'),
        port:        this.fvGetAndReportPathRules('spec.rules.http.paths.backend.service.port.number'),
        target:      this.fvGetAndReportPathRules('spec.rules.http.paths.backend.service.name'),

      };
    },
    defaultBackendPathRules() {
      const rulesExist = (this.value?.spec?.rules || []).length > 0;
      const defaultBackendExist = !!this.value?.spec?.defaultBackend?.service;

      if (!rulesExist || defaultBackendExist) {
        return {
          name: this.fvGetAndReportPathRules('spec.defaultBackend.service.name'),
          port: this.fvGetAndReportPathRules('spec.defaultBackend.service.port.number'),
        };
      }

      return { name: [], port: [] };
    },
    serviceTargets() {
      return this.ingressHelper.findAndMapServiceTargets(this.services);
    },
    firstTabLabel() {
      return this.isView ? this.t('ingress.rulesAndCertificates.title') : this.t('ingress.rules.title');
    },
    certificates() {
      return this.ingressHelper.findAndMapCerts(this.secrets);
    },
    ingressClasses() {
      return this.allIngressClasses.map((ingressClass) => ({
        label: ingressClass.metadata.name,
        value: ingressClass.metadata.name,
      }));
    },
  },

  created() {
    this.value['spec'] = this.value.spec || {};
    this.value.spec['rules'] = this.value.spec.rules || [{}];
    this.value.spec['backend'] = this.value.spec.backend || {};

    if (!this.value.spec.tls || Object.keys(this.value.spec.tls[0] || {}).length === 0) {
      this.value.spec['tls'] = [];
    }

    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    willSave() {
      const backend = get(this.value.spec, this.value.defaultBackendPath);
      const serviceName = get(backend, this.value.serviceNamePath);
      const servicePort = get(backend, this.value.servicePortPath);

      if (backend && (!serviceName || !servicePort)) {
        const path = this.value.defaultBackendPath;

        set(this.value.spec, path, null);
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
    :validation-passed="fvFormIsValid"
    :errors="fvUnreportedValidationErrors"
    :description="t('ingress.description')"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :rules="{name: fvGetAndReportPathRules('metadata.name'), namespace: fvGetAndReportPathRules('metadata.namespace'), description: []}"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
    />
    <Error
      :value="value.spec"
      :rules="fvGetAndReportPathRules('spec')"
      as-banner
    />
    <Tabbed :side-tabs="true">
      <Tab
        :label="firstTabLabel"
        name="rules"
        :weight="4"
        :error="tabErrors.rules"
      >
        <Rules
          :value="value"
          :mode="mode"
          :service-targets="serviceTargets"
          :certificates="certificates"
          :rules="rulesPathRules"
          @update:value="$emit('input', $event)"
        />
      </Tab>
      <Tab
        :label="t('ingress.defaultBackend.label')"
        name="default-backend"
        :weight="3"
        :error="tabErrors.defaultBackend"
      >
        <DefaultBackend
          :value="value"
          :service-targets="serviceTargets"
          :mode="mode"
          :rules="defaultBackendPathRules"
          @update:value="$emit('input', $event)"
        />
      </Tab>
      <Tab
        v-if="!isView"
        :label="t('ingress.certificates.label')"
        name="certificates"
        :weight="2"
      >
        <Certificates
          :value="value"
          :mode="mode"
          :certificates="certificates"
          :rules="{host: fvGetAndReportPathRules('spec.tls.hosts')}"
          @update:value="$emit('input', $event)"
        />
      </Tab>
      <Tab
        :label="t('ingress.ingressClass.label')"
        name="ingress-class"
        :weight="1"
      >
        <IngressClass
          :value="value"
          :mode="mode"
          :ingress-classes="ingressClasses"
          @update:value="$emit('input', $event)"
        />
      </Tab>
      <Tab
        v-if="!isView"
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="0"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
