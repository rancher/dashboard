<script>
import CreateEditView from '@/mixins/create-edit-view';
import { findBy, removeObject } from '@/utils/array';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import Footer from '@/components/form/Footer';
import { _EDIT, EDIT_CONTAINER } from '@/config/query-params';

export default {
  name:       'CruService',

  components: {
    LabeledInput,
    NameNsDescription,
    Footer,
  },
  mixins:     [CreateEditView],

  data() {
    if ( !this.value.spec ) {
      this.value.spec = {};
    }

    const spec = this.value.spec;
    const containerName = this.$route.query[EDIT_CONTAINER];
    const multipleContainers = ( !!(spec.containers && spec.containers.length) );

    let container, isSidecar;

    if ( containerName ) {
      container = spec.containers[name];
      isSidecar = true;
    } else {
      container = spec;
      isSidecar = false;
    }

    return {
      multipleContainers,
      containerName,
      isSidecar,
      container
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
      <LabeledInput
        v-if="containerName"
        v-model="container.name"
        :mode="onlyForCreate"
        :label="nameLabel"
        :placeholder="namePlaceholder"
        :required="true"
      />
      <NameNsDescription
        v-else
        :value="value"
        :mode="mode"
        name-label="Service Name"
      />

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
