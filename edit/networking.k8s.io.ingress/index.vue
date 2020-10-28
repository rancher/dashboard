<script>
import { allHash } from '@/utils/promise';
import { SECRET, SERVICE } from '@/config/types';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import Tab from '@/components/Tabbed/Tab';
import { _VIEW } from '@/config/query-params';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import Tabbed from '@/components/Tabbed';
import { get, set } from '@/utils/object';
import DefaultBackend from './DefaultBackend';
import Certificates from './Certificates';
import Rules from './Rules';

export default {
  name:       'CRUIngress',
  components: {
    Certificates,
    CruResource,
    DefaultBackend,
    Labels,
    NameNsDescription,
    Rules,
    Tab,
    Tabbed
  },
  mixins: [CreateEditView],
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
    const hash = await allHash({
      secrets:  this.$store.dispatch('cluster/findAll', { type: SECRET }),
      services: this.$store.dispatch('cluster/findAll', { type: SERVICE }),
    });

    this.allServices = hash.services;
    this.allSecrets = hash.secrets;
  },
  data() {
    return { allSecrets: [], allServices: [] };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    serviceTargets() {
      return this.filterByCurrentResourceNamespace(this.allServices)
        .map(service => ({
          label: service.metadata.name,
          value: service.metadata.name,
          ports: service.spec.ports?.map(p => p.port)
        }));
    }
  },
  created() {
    if (!this.value.spec) {
      this.value.spec = {};
    }
    if (!this.value.spec.rules) {
      this.value.spec.rules = [{}];
    }
    if (!this.value.spec.backend) {
      this.value.spec.backend = { };
    }
    if (!this.value.spec.tls || Object.keys(this.value.spec.tls[0] || {}).length === 0) {
      this.value.spec.tls = [];
    }
    this.registerBeforeHook(this.willSave, 'willSave');
  },
  methods: {
    filterByCurrentResourceNamespace(resources) {
      return resources.filter((resource) => {
        return resource.metadata.namespace === this.value.metadata.namespace;
      });
    },
    willSave() {
      const backend = get(this.value.spec, this.value.defaultBackendPath);
      const serviceName = get(backend, this.value.serviceNamePath);
      const servicePort = get(backend, this.value.servicePortPath);

      if (backend && (!serviceName || !servicePort)) {
        set(this.value.spec, this.value.defaultbackendPath, null);
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
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
    />

    <div class="spacer"></div>

    <Tabbed :side-tabs="true">
      <Tab :label="t('ingress.rules.title')" name="rules" :weight="3">
        <Rules v-model="value" :mode="mode" :service-targets="serviceTargets" />
      </Tab>
      <Tab :label="t('ingress.certificates.label')" name="certificates" :weight="2">
        <Certificates v-model="value" :mode="mode" :secrets="allSecrets" />
      </Tab>
      <Tab :label="t('ingress.defaultBackend.label')" name="default-backend" :weight="1">
        <DefaultBackend v-model="value" :service-targets="serviceTargets" :mode="mode" />
      </Tab>
      <Tab
        name="labels-and-annotations"
        :label="t('generic.labelsAndAnnotations')"
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
