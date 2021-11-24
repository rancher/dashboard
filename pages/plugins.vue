<script>
import LabeledInput from '@shell/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  data() {
    return {
      name:     '',
      location: ''
    };
  },
  layout:     'plain',
  methods:    {
    loadPluginByName() {
      const moduleUrl = `/pkg/${ this.name }/${ this.name }.umd.min.js`;

      this.load(this.name, moduleUrl);
    },

    loadPlugin() {
      this.load(this.name, this.location);
    },

    load(name, url) {
      if (!name) {
        const parts = url.split('/');
        const n = parts[parts.length - 1];

        name = n.split('.')[0];
      }

      this.$extension.loadAsync(name, url).then(() => {
        this.$store.dispatch('growl/success', {
          title:   `Loaded plugin ${ name }`,
          message: `Plugin was loaded successfully`,
          timeout: 3000,
        }, { root: true });
      }).catch((error) => {
        const message = typeof error === 'object' ? 'Could not load code' : error;

        this.$store.dispatch('growl/error', {
          title:   'Error loading plugin',
          message,
          timeout: 5000
        }, { root: true });
      });
    }
  }
};
</script>

<template>
  <div class="plugins">
    <h2>Plugins</h2>
    <br />
    <h4 class="mt-20">
      Load Plugin
    </h4>
    <div class="custom">
      <div class="fields">
        <LabeledInput v-model="name" label="Plugin name" />
      </div>
      <button class="btn role-primary" @click="loadPluginByName()">
        Load Plugin
      </button>
    </div>
    <br />
    <br />
    <h4 class="mt-20">
      Load Plugin from URL
    </h4>
    <div class="custom">
      <div class="fields">
        <!--
        <LabeledInput v-model="name" label="Plugin name" />
        -->
        <LabeledInput v-model="location" label="Plugin URL" />
      </div>
      <button class="btn role-primary" @click="loadPlugin()">
        Load Plugin
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .plugins {
    display: inherit;
  }

  .fields {
    display: flex;
    // > div:first-child {
    //   width: 260px;
    //   margin-right: 20px;
    // }
  }

  .custom {
    button {
      margin-top: 10px;
    }
  }

</style>
