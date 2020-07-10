<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters(['isRancher', 'clusterId']),

    value: {
      get() {
        return this.$store.getters['currentProduct'];
      },

      set(product) {
        // Try product-specific index first
        const opt = {
          name:   `c-cluster-${ product }`,
          params: { cluster: this.clusterId, product }
        };

        if ( !this.$router.getMatchedComponents(opt).length ) {
          opt.name = 'c-cluster-product';
        }

        this.$router.push(opt);
      }
    },

    options() {
      const t = this.$store.getters['i18n/t'];

      return ['explorer', 'apps', 'access', 'gatekeeper', 'rio'].map((name) => {
        return {
          label: t(`product.${ name }`),
          value: name
        };
      });
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
      :reduce="opt=>opt.value"
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
