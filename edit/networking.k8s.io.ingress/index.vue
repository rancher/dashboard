<script>
import Certificate from './Certificate';
import Rule from './Rule';

import { clone } from '@/utils/object';
import { allHash } from '@/utils/promise';
import { WORKLOAD, SECRET, TLS_CERT } from '@/config/types';
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
    const { metadata = {}, spec = {} } = clone(this.value);

    if (!spec.rules) {
      spec.rules = [{}];
    }
    if (!spec.tls) {
      spec.tls = [{ }];
    }

    return {
      metadata, spec, allSecrets:   [], allWorkloads: []
    };
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
  methods: {
    async loadDeps() {
      const hash = await allHash({
        secrets: this.$store.dispatch('cluster/findAll', { type: SECRET }),
        ...Object.values(WORKLOAD).reduce((all, type) => {
          all[type] = this.$store.dispatch('cluster/findAll', { type });

          return all;
        }, {})
      });

      const workloads = Object.values(WORKLOAD).map(type => hash[type]);

      const flattened = workloads.reduce((all, type) => {
        all.push(...type);

        return all;
      }, []);

      this.allSecrets = hash.secrets;
      this.allWorkloads = flattened;
    },

    addRule() {
      this.spec.rules = [...this.spec.rules, {}];
    },

    removeRule(idx) {
      const neu = [...this.spec.rules];

      neu.splice(idx, 1);

      this.$set(this.spec, 'rules', neu);
    },

    updateRule(neu, idx) {
      this.$set(this.spec.rules, idx, neu);
    },

    addCert() {
      this.spec.tls = [...this.spec.tls, {}];
    },

    removeCert(idx) {
      const neu = [...this.spec.tls];

      neu.splice(idx, 1);
      this.$set(this.spec, 'tls', neu);
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

    saveIngress(cb) {
      const defaultRule = this.spec.rules.filter(rule => rule.asDefault)[0];
      const nonDefaultRules = this.spec.rules.filter(rule => !rule.asDefault);
      const defaultBackend = defaultRule?.http?.paths[0]?.backend;

      nonDefaultRules.forEach(rule => delete rule.asDefault);

      if (defaultBackend ) {
        this.$set(this.spec, 'backend', defaultBackend);
      }
      this.spec.rules = nonDefaultRules;

      this.$set(this.value, 'spec', this.spec);
      this.$set(this.value, 'metadata', this.metadata);

      const saveUrl = this.value.urlFromAPIVersion;

      this.save(cb, saveUrl);
    }
  }
};
</script>

<template>
  <form>
    <NameNsDescription :value="{metadata}" :mode="mode" @input="e=>metadata=e" />
    <div>
      <h3>
        Rules
      </h3>
      <Rule
        v-for="(rule, i) in spec.rules"
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
          <Labels :spec="{metadata:{}}" mode="create" />
        </Tab>
        <Tab label="Certificates" name="certificates">
          <Certificate
            v-for="(cert,i) in spec.tls"
            :key="i"
            :certs="certificates"
            :value="cert"
            @input="e=>$set(spec.tls, i, e)"
            @remove="e=>removeCert(i)"
          />
          <button class="btn btn-sm role-primary mt-20 " type="button" @click="addCert">
            Add Certificate
          </button>
        </Tab>
      </Tabbed>
    </div>
    <Footer :errors="errors" :mode="mode" @save="saveIngress" @done="done" />
  </form>
</template>
