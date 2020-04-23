<script>
import Certificate from './Certificate';
import Rule from './Rule';
import { allHash } from '@/utils/promise';
import { SECRET, TLS_CERT, WORKLOAD_TYPES } from '@/config/types';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import LoadDeps from '@/mixins/load-deps';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Labels from '@/components/form/Labels';
import Footer from '@/components/form/Footer';

export default {
  name:  'CRUIngress',

  components: {
    NameNsDescription,
    Rule,
    Tabbed,
    Tab,
    Labels,
    Certificate,
    Footer
  },

  mixins: [CreateEditView, LoadDeps],

  props: {
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

  data() {
    return { allSecrets: [], allWorkloads: [] };
  },

  computed: {
    workloads() {
      return this.filterByNamespace(this.filterByOwner(this.allWorkloads)).reduce((all, workload) => {
        all.push(workload?.metadata?.name);

        return all;
      }, []);
    },

    certificates() {
      return this.filterByNamespace(this.allSecrets.filter(secret => secret._type === TLS_CERT)).map((secret) => {
        const { id } = secret;

        return id.slice(id.indexOf('/') + 1);
      });
    },

  },

  created() {
    if (!this.value.spec) {
      this.value.spec = {};
    }

    if (!this.value.spec.rules) {
      this.value.spec.rules = [{}];
    }

    if (this.value.spec.backend) {
      if (!this.value.spec.rules[0].http) {
        this.value.spec.rules[0].http = { paths: [] };
      }
      this.value.spec.rules[0].http.paths.push({ backend: this.value.spec.backend });
      this.value.spec.rules[0].asDefault = true;
    }

    if (!this.value.spec.tls) {
      this.value.spec.tls = [{ }];
    }

    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    async loadDeps() {
      const hash = await allHash({
        secrets: this.$store.dispatch('cluster/findAll', { type: SECRET }),
        ...Object.values(WORKLOAD_TYPES).reduce((all, type) => {
          all[type] = this.$store.dispatch('cluster/findAll', { type });

          return all;
        }, {})
      });

      const workloads = Object.values(WORKLOAD_TYPES).map(type => hash[type]);

      const flattened = workloads.reduce((all, type) => {
        all.push(...type);

        return all;
      }, []);

      this.allSecrets = hash.secrets;
      this.allWorkloads = flattened;
    },

    addRule() {
      this.value.spec.rules = [...this.value.spec.rules, {}];
    },

    removeRule(idx) {
      const neu = [...this.value.spec.rules];

      neu.splice(idx, 1);

      this.$set(this.value.spec, 'rules', neu);
    },

    updateRule(neu, idx) {
      this.$set(this.value.spec.rules, idx, neu);
    },

    addCert() {
      this.value.spec.tls = [...this.value.spec.tls, {}];
    },

    removeCert(idx) {
      const neu = [...this.value.spec.tls];

      neu.splice(idx, 1);
      this.$set(this.value.spec, 'tls', neu);
    },

    // filter a given list of resources by currently selected namespaces
    filterByNamespace(list) {
      const namespaces = this.$store.getters['namespaces']();

      return list.filter((resource) => {
        return !!namespaces[resource.metadata.namespace];
      });
    },

    // filter by ownerReference id OR filter by lack of owner
    filterByOwner(list, id) {
      return list.filter((resource) => {
        const owners = resource.metadata.ownerReferences;

        if (!id) {
          return !owners;
        }

        const owner = owners[0] || {};

        return (owner.name === id);
      });
    },

    willSave() {
      const defaultRule = this.value.spec.rules.filter(rule => rule.asDefault)[0];
      const defaultBackend = defaultRule?.http?.paths[0]?.backend;
      const nonDefaultRules = this.value.spec.rules.filter(rule => !rule.asDefault);

      nonDefaultRules.forEach(rule => delete rule.asDefault);
      this.value.spec.rules = nonDefaultRules;

      if (defaultBackend ) {
        this.$set(this.value.spec, 'backend', defaultBackend);
      }
    },
  }
};
</script>

<template>
  <form>
    <NameNsDescription :value="value" :mode="mode" />
    <div>
      <h3>
        Rules
      </h3>
      <Rule
        v-for="(rule, i) in value.spec.rules"
        :key="i"
        :value="rule"
        :workloads="workloads"
        @remove="e=>removeRule(i)"
        @input="e=>updateRule(e,i)"
      />
      <button class="btn btn-sm role-primary mt-20 " type="button" @click="addRule">
        Add Rule
      </button>
    </div>
    <div>
      <Tabbed :default-tab="'labels'">
        <Tab name="labels" label="Labels">
          <Labels :spec="value" mode="create" />
        </Tab>
        <Tab label="Certificates" name="certificates">
          <Certificate
            v-for="(cert,i) in value.spec.tls"
            :key="i"
            :certs="certificates"
            :value="cert"
            @input="e=>$set(value.spec.tls, i, e)"
            @remove="e=>removeCert(i)"
          />
          <button class="btn btn-sm role-primary mt-20 " type="button" @click="addCert">
            Add Certificate
          </button>
        </Tab>
      </Tabbed>
    </div>
    <Footer :errors="errors" :mode="mode" @save="save" @done="done" />
  </form>
</template>
