<script>
import { allHash } from '@/utils/promise';
import { SECRET, SERVICE } from '@/config/types';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import Tab from '@/components/Tabbed/Tab';
import Footer from '@/components/form/Footer';
import ResourceTabs from '@/components/form/ResourceTabs';
import { _VIEW } from '@/config/query-params';
import DefaultBackend from './DefaultBackend';
import Certificates from './Certificates';
import Rules from './Rules';
export default {
  name:       'CRUIngress',
  components: {
    DefaultBackend,
    NameNsDescription,
    Rules,
    Tab,
    Certificates,
    Footer,
    ResourceTabs
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
    if (!this.value.spec.tls || Object.keys(this.value.spec.tls[0]).length === 0) {
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
      if (this.value?.spec?.backend && (!this.value?.spec?.backend?.serviceName || !this.value?.spec?.backend?.servicePort)) {
        this.value.spec.backend = null;
      }
    },
  }
};
</script>
<template>
  <form>
    <NameNsDescription :value="value" :mode="mode" />
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-12">
        <h2>
          {{ t('ingress.rules.title') }}
        </h2>
        <Rules v-model="value" :mode="mode" :service-targets="serviceTargets" />
      </div>
    </div>
    <div class="spacer"></div>
    <div>
      <ResourceTabs v-model="value" :mode="mode">
        <template #before>
          <Tab :label="t('ingress.certificates.label')" name="certificates">
            <Certificates v-model="value" :mode="mode" :secrets="allSecrets" />
          </Tab>
          <Tab :label="t('ingress.defaultBackend.label')" name="default-backend">
            <DefaultBackend v-model="value.spec.backend" :service-targets="serviceTargets" :mode="mode" />
          </Tab>
        </template>
      </ResourceTabs>
    </div>
    <Footer :errors="errors" :mode="mode" @save="save" @done="done" />
  </form>
</template>
