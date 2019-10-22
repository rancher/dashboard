<script>
import { CONFIG_MAP, SECRET } from '../../../config/types';
import Top from './Top';
import Command from './Command';
import HealthCheck from './HealthCheck';
import Networking from './Networking';
import Scheduling from './Scheduling';
import Security from './Security';
import Upgrading from './Upgrading';
import Volumes from './Volumes';
import Loading from '@/components/Loading';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import CreateEditView from '@/mixins/create-edit-view';
import { _EDIT, EDIT_CONTAINER } from '@/config/query-params';
import Footer from '@/components/form/Footer';
import { findBy, filterBy, removeObject } from '@/utils/array';
import { allHash } from '@/utils/promise';

export default {
  name:       'CruService',

  components: {
    Loading,
    Tabbed,
    Tab,
    Top,
    Command,
    HealthCheck,
    Networking,
    Scheduling,
    Security,
    Upgrading,
    Volumes,
    Footer
  },
  mixins:     [CreateEditView],

  data() {
    if ( !this.value.spec ) {
      this.value.spec = {};
    }

    const containerName = this.$route.query[EDIT_CONTAINER];
    const rootSpec = this.value.spec;
    const multipleContainers = ( !!(rootSpec.containers && rootSpec.containers.length) );
    let spec = rootSpec;
    let isSidecar = false;
    let nameResource = this.value.metadata;

    if ( !nameResource ) {
      nameResource = { name: '' };
      this.value.metadata = nameResource;
    }

    if ( containerName ) {
      nameResource = spec.containers[name];
      spec = nameResource.spec;
      isSidecar = true;
    }

    if ( typeof spec.imagePullPolicy === 'undefined' ) {
      spec.imagePullPolicy = 'Always';
    }

    console.log('Data');

    return {
      loading:       true,
      multipleContainers,
      nameResource,
      containerName,
      isSidecar,
      rootSpec,
      spec,
      allConfigMaps: null,
      allSecrets:    null,
    };
  },

  computed: {
    promptForContainer() {
      return this.mode === _EDIT && this.multipleContainers && this.containerName === undefined;
    },

    configMaps() {
      const namespace = this.value.metadata.namespace;

      if ( !namespace ) {
        return [];
      }

      const matching = filterBy((this.allConfigMaps || []), 'metadata.namespace', namespace);
      const out = [];

      for ( const item of matching ) {
        const name = item.metadata.name;
        const keys = [];

        for ( const k of Object.keys(item.data || {}) ) {
          keys.push({ label: k, value: `${ name }/${ k }` });
        }

        for ( const k of Object.keys(item.binaryData || {}) ) {
          keys.push({ label: k, value: `${ name }/${ k }` });
        }

        if ( keys.length ) {
          out.push({
            group: item.metadata.name,
            items: keys
          });
        }
      }

      return out;
    },

    secrets() {
      const namespace = this.value.metadata.namespace;

      if ( !namespace ) {
        return [];
      }

      const out = filterBy((this.allSecrets || []), 'metadata.namespace', namespace);

      return out;
    },
  },

  async created() {
    const hash = await allHash({
      configMaps: this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP }),
      secrets:    this.$store.dispatch('cluster/findAll', { type: SECRET }),
    });

    this.allSecrets = hash.secrets;
    this.allConfigMaps = hash.configMaps;
    this.loading = false;
  },

  methods: {
    selectContainer(name) {
      this.$router.applyQuery({ [EDIT_CONTAINER]: name });
      this.containerName = name;
    },

    remove(name) {
      const containers = this.value.spec.containers;
      const entry = findBy(containers, 'name', name);

      removeObject(containers, entry);
      this.save();
    },
  },
};
</script>

<template>
  <form>
    <div v-if="loading">
      <Loading />
    </div>
    <div v-else-if="promptForContainer" class="clearfix">
      <p>This service consists of multiple containers, which one do you want to edit?</p>
      <div class="box">
        <p>The primary container</p>
        <p>{{ value.nameDisplay }}</p>
        <button class="btn bg-primary" type="button" @click="selectContainer('')">
          Edit
        </button>
      </div>
      <div v-for="choice in value.spec.containers" :key="choice.name" class="box">
        <p>Sidecar</p>
        <p>{{ choice.name }}</p>
        <button class="btn bg-primary" type="button" @click="selectContainer(choice.name)">
          Edit
        </button>
        <button class="btn bg-error" type="button" @click="remove(choice.name)">
          Delete
        </button>
      </div>
    </div>
    <div v-else>
      <Top :value="value" :spec="spec" :name-resource="nameResource" :is-sidecar="isSidecar" :mode="mode" />

      <Tabbed default-tab="command">
        <Tab name="command" label="Command">
          <Command :spec="spec" :mode="mode" :config-maps="configMaps" :secrets="secrets" />
        </Tab>
        <Tab name="network" label="Network">
          <Networking :spec="spec" :mode="mode" />
        </Tab>
        <Tab name="healthcheck" label="Health Check">
          <HealthCheck :spec="spec" :mode="mode" />
        </Tab>
        <Tab name="scheduling" label="Scheduling">
          <Scheduling :spec="spec" :mode="mode" />
        </Tab>
        <Tab name="security" label="Security">
          <Security :spec="spec" :mode="mode" />
        </Tab>
        <Tab name="upgrading" label="Upgrading">
          <Upgrading :spec="spec" :mode="mode" />
        </Tab>
        <Tab name="volumes" label="Volumes">
          <Volumes :spec="spec" :mode="mode" />
        </Tab>
      </Tabbed>

      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .box {
    float: left;
    border: 1px solid var(--border);
    padding: 20px;
    text-align: center;
    width: 25%;
    margin-right: 20px;

    P {
      margin: 0;
    }

    &:last-child {
      margin-right: 0;
    }
  }
</style>
