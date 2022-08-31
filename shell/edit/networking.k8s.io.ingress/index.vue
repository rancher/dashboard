<script>
import { allHash } from '@shell/utils/promise';
import { SECRET, SERVICE, INGRESS_CLASS } from '@shell/config/types';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Error from '@shell/components/form/Error';
import Tabbed from '@shell/components/Tabbed';
import { get, set } from '@shell/utils/object';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import DefaultBackend from './DefaultBackend';
import Certificates from './Certificates';
import Rules from './Rules';
import IngressClass from './IngressClass';

export default {
  name:       'CRUIngress',
  components: {
    IngressClass,
    Certificates,
    CruResource,
    DefaultBackend,
    Labels,
    NameNsDescription,
    Rules,
    Tab,
    Tabbed,
    Error
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
    const ingressClassSchema = this.$store.getters[`cluster/schemaFor`](INGRESS_CLASS);
    const hash = await allHash({
      secrets:        this.$store.dispatch('cluster/findAll', { type: SECRET }),
      services:       this.$store.dispatch('cluster/findAll', { type: SERVICE }),
      ingressClasses: ingressClassSchema ? this.$store.dispatch('cluster/findAll', { type: INGRESS_CLASS }) : Promise.resolve([]),
    });

    this.allServices = hash.services;
    this.allSecrets = hash.secrets;
    this.allIngressClasses = hash.ingressClasses;
  },
  data() {
    return {
      allSecrets:        [],
      allServices:       [],
      allIngressClasses: [],
      fvFormRuleSets:    [
        {
          path: 'metadata.name', rules: ['required', 'hostname'], translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'spec.rules.host', rules: ['hostname'], translationKey: 'ingress.rules.requestHost.label'
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
        { path: 'spec.tls.hosts', rules: ['required', 'hostname'] }
      ],
      fvReportedValidationPaths: ['spec.rules.http.paths.backend.service.port.number', 'spec.rules.http.paths.path', 'spec.rules.http.paths.backend.service.name']
    };
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
      return this.filterByCurrentResourceNamespace(this.allServices)
        .map(service => ({
          label: service.metadata.name,
          value: service.metadata.name,
          ports: service.spec.ports?.map(p => p.port)
        }));
    },
    firstTabLabel() {
      return this.isView ? this.t('ingress.rulesAndCertificates.title') : this.t('ingress.rules.title');
    },
    certificates() {
      return this.filterByCurrentResourceNamespace(this.allSecrets.filter(secret => secret._type === TYPES.TLS)).map((secret) => {
        const { id } = secret;

        return id.slice(id.indexOf('/') + 1);
      });
    },
    ingressClasses() {
      return this.allIngressClasses.map(ingressClass => ({
        label: ingressClass.metadata.name,
        value: ingressClass.metadata.name,
      }));
    },
  },
  created() {
    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'rules', this.value.spec.rules || [{}]);
    this.$set(this.value.spec, 'backend', this.value.spec.backend || {});

    if (!this.value.spec.tls || Object.keys(this.value.spec.tls[0] || {}).length === 0) {
      this.$set(this.value.spec, 'tls', []);
    }

    this.registerBeforeHook(this.willSave, 'willSave');
  },
  methods: {
    filterByCurrentResourceNamespace(resources) {
      // When configuring an Ingress, the options for Secrets and
      // default backend Services are limited to the namespace of the Ingress.
      return resources.filter((resource) => {
        return resource.metadata.namespace === this.value.metadata.namespace;
      });
    },
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
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="fvFormIsValid"
    :errors="fvUnreportedValidationErrors"
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
    <Error :value="value.spec" :rules="fvGetAndReportPathRules('spec')" as-banner />
    <Tabbed :side-tabs="true">
      <Tab :label="firstTabLabel" name="rules" :weight="4" :error="tabErrors.rules">
        <Rules v-model="value" :mode="mode" :service-targets="serviceTargets" :certificates="certificates" :rules="rulesPathRules" />
      </Tab>
      <Tab :label="t('ingress.defaultBackend.label')" name="default-backend" :weight="3" :error="tabErrors.defaultBackend">
        <DefaultBackend v-model="value" :service-targets="serviceTargets" :mode="mode" :rules="defaultBackendPathRules" />
      </Tab>
      <Tab v-if="!isView" :label="t('ingress.certificates.label')" name="certificates" :weight="2">
        <Certificates v-model="value" :mode="mode" :certificates="certificates" :rules="{host: fvGetAndReportPathRules('spec.tls.hosts')}" />
      </Tab>
      <Tab :label="t('ingress.ingressClass.label')" name="ingress-class" :weight="1">
        <IngressClass v-model="value" :mode="mode" :ingress-classes="ingressClasses" />
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
