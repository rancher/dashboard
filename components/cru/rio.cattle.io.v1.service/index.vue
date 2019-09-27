<script>
import Top from './Top';
import Command from './Command';
import HealthCheck from './HealthCheck';
import Networking from './Networking';
import Scheduling from './Scheduling';
import Security from './Security';
import Upgrading from './Upgrading';
import Volumes from './Volumes';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import CreateEditView from '@/mixins/create-edit-view';
import { _EDIT, EDIT_CONTAINER } from '@/config/query-params';
import Footer from '@/components/form/Footer';
import { findBy, removeObject } from '@/utils/array';

export default {
  name:       'CruService',

  components: {
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

    return {
      multipleContainers,
      nameResource,
      containerName,
      isSidecar,
      rootSpec,
      spec,
    };
  },

  computed: {
    promptForContainer() {
      return this.mode === _EDIT && this.multipleContainers && this.containerName === undefined;
    }
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
    <div v-if="promptForContainer" class="clearfix">
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
      <Top :value="value" :name-resource="nameResource" :is-sidecar="isSidecar" :mode="mode" />

      <Tabbed default-tab="command">
        <Tab name="command" label="Command">
          <Command :spec="spec" />
        </Tab>
        <Tab name="network" label="Network">
          <Networking :spec="spec" />
        </Tab>
        <Tab name="healthcheck" label="Health Check">
          <HealthCheck :spec="spec" />
        </Tab>
        <Tab name="scheduling" label="Scheduling">
          <Scheduling :spec="spec" />
        </Tab>
        <Tab name="security" label="Security">
          <Security :spec="spec" />
        </Tab>
        <Tab name="upgrading" label="Upgrading">
          <Upgrading :spec="spec" />
        </Tab>
        <Tab name="volumes" label="Volumes">
          <Volumes :spec="spec" />
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
