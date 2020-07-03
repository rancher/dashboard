<script>
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['isRancher']),

    value: {
      get() {
        return 'explorer';
      },

      set(neu) {
        debugger;
        // this.$router.push({ name: 'c-cluster', params: { cluster: neu.id } });
      }
    },

    options() {
      return ['explorer', 'apps', 'auth'];
    },

    backToRancherLink() {
      if ( !this.isRancher ) {
        return;
      }

      const cluster = this.$store.getters['currentCluster'];
      let link = '/';

      if ( cluster ) {
        link = `/c/${ escape(cluster.id) }`;
      }

      if ( process.env.dev ) {
        link = `https://localhost:8000${ link }`;
      }

      return link;
    },
  },

  methods: {
    focus() {
      this.$refs.select.$refs.search.focus();
    }
  },
};

</script>

<template>
  <div class="filter">
    <v-select
      ref="select"
      key="prduct"
      v-model="value"
      :clearable="false"
      :options="options"
      label="label"
    >
    </v-select>
    <button v-shortkey.once="['p']" class="hide" @shortkey="focus()" />
  </div>
</template>

<style lang="scss" scoped>
  .filter ::v-deep .v-select {
    max-width: 100%;
    display: inline-block;

    &.vs--disabled .vs__actions {
      display: none;
    }

    .vs__dropdown-toggle {
      height: var(--header-height);
      margin-left: 35px;
      background-color: transparent;
      border: 0;

      .vs__actions {
        margin-left: -10px;
      }
    }

    .vs__selected {
      margin: 2px;
      user-select: none;
      cursor: default;
      color: white;
      line-height: calc(var(--header-height) - 10px);
    }
  }

  .filter ::v-deep INPUT {
    width: auto;
    background-color: transparent;
  }

  .filter ::v-deep INPUT:hover {
    background-color: transparent;
  }

</style>
