<script>
import { createPopper } from '@popperjs/core';
import { MANAGEMENT } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { findBy } from '@/utils/array';
import { mapGetters, mapState } from 'vuex';
import Select from '@/components/form/Select';
import $ from 'jquery';

export default {
  components: { Select },

  computed: {
    ...mapState(['isMultiCluster']),
    ...mapGetters(['currentCluster']),

    value: {
      get() {
        const options = this.options;
        const existing = findBy(
          options,
          'id',
          this.$store.getters['clusterId']
        );

        if (existing) {
          return existing;
        }

        return options[0];
      },

      set(neu) {
        this.$router.push({ name: 'c-cluster', params: { cluster: neu.id } });
      },
    },

    options() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);

      const out = all.map((x) => {
        return {
          id:     x.id,
          label:  x.nameDisplay,
          ready:  x.isReady,
          osLogo: x.providerOsLogo,
        };
      });

      return sortBy(out, ['ready:desc', 'label']);
    },
  },

  methods: {
    focus() {
      this.$refs.select.focusSearch();
    },
    withPopper(dropdownList, component, { width }) {
      /**
       * We need to explicitly define the dropdown width since
       * it is usually inherited from the parent with CSS.
       */
      const componentWidth = $(component.$parent.$el).width();

      dropdownList.style['min-width'] = `${ componentWidth }px`;
      dropdownList.style.width = 'min-content';
      dropdownList.className += ' cluster-switcher-container';

      /**
       * Here we position the dropdownList relative to the $refs.toggle Element.
       *
       * The 'offset' modifier aligns the dropdown so that the $refs.toggle and
       * the dropdownList overlap by 1 pixel.
       *
       * The 'toggleClass' modifier adds a 'drop-up' class to the Vue Select
       * wrapper so that we can set some styles for when the dropdown is placed
       * above.
       */
      const popper = createPopper(component.$refs.toggle, dropdownList, {
        placement: 'bottom-end',
        modifiers: [
          {
            name:    'offset',
            options: { offset: [0, 2] },
          },
          {
            name:    'toggleClass',
            enabled: true,
            phase:   'write',
            fn({ state }) {
              component.$el.setAttribute('x-placement', state.placement);
            },
          },
        ],
      });

      /**
       * To prevent memory leaks Popper needs to be destroyed.
       * If you return function, it will be called just before dropdown is removed from DOM.
       */
      return () => popper.destroy();
    },
  },
};
</script>

<template>
  <div class="filter">
    <Select
      ref="select"
      key="cluster"
      v-model="value"
      :append-to-body="true"
      :popper-override="withPopper"
      placement="bottom"
      :searchable="true"
      :selectable="(option) => option.ready"
      :clearable="false"
      :options="options"
    >
      <template #selected-option="opt">
        <span class="cluster-label-container">
          <img
            v-if="currentCluster"
            class="cluster-switcher-os-logo"
            :src="currentCluster.providerOsLogo"
          />
          <span class="cluster-label">
            {{ opt.label }}
          </span>
        </span>
      </template>

      <template #no-options="{ searching }">
        <template v-if="searching">
          No clusters found.
        </template>
        <em v-else class="text-muted">Start typing to search for a cluster.</em>
      </template>

      <template #option="opt">
        <span class="dropdown-option">
          <span class="logo">
            <img
              v-if="opt.osLogo"
              class="cluster-switcher-os-logo"
              :src="opt.osLogo"
            />
          </span>
          <span class="content">
            <b v-if="opt === value">{{ opt.label }}</b>
            <nuxt-link
              v-else-if="opt.ready"
              class="cluster"
              :to="{ name: 'c-cluster', params: { cluster: opt.id } }"
            >
              {{ opt.label }}
            </nuxt-link>
            <span v-else>{{ opt.label }}</span>
          </span>
        </span>
      </template>
    </Select>
    <button v-shortkey.once="['c']" class="hide" @shortkey="focus()" />
  </div>
</template>

<style lang="scss">
// should be outside scoped css, class is dynamic and added by withPopper so scoped + ::v-deep doesn't work
.cluster-switcher-container {
  &.vs__dropdown-menu {
    .vs__dropdown-option {
      padding: 3px 20px 3px 8px;
    }
  }
}
</style>

<style lang="scss" scoped>
.cluster-switcher-os-logo {
  height: 16px;
  display: inline-block;
  vertical-align: middle;
}
.cluster-switcher-container {
  .cluster-label-container {
    width: 100%;
    display: grid;
    grid-template-columns: 15% 85%;
    align-items: center;
    align-content: center;
  }

  // matches the padding a layout of the option (and logo/content) to the selected option so it doesn't look off
  .dropdown-option {
    display: grid;
    width: 100%;
    grid-template-columns: 25px fit-content(100%);
    align-items: center;
    align-content: center;
  }
}

.filter ::v-deep .unlabeled-select .v-select {
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius);
  color: var(--header-btn-text);
  display: inline-block;
  max-width: 100%;

  .vs__selected {
    width: 100%;
  }

  &.vs--disabled .vs__actions {
    display: none;
  }

  .vs__actions:after {
    fill: white !important;
    color: white !important;
  }

  .vs__dropdown-toggle {
    background: rgba(0, 0, 0, 0.05);
    border-radius: var(--border-radius);
    border: 1px solid var(--header-btn-bg);
    color: var(--header-btn-text);
    max-width: 100%;
    padding-top: 0;
    height: 40px;

    .vs__actions {
      margin-left: -10px;
    }
  }

  .vs__selected {
    border: none;
    position: absolute;
    user-select: none;
    cursor: default;
    color: white;
    line-height: calc(var(--header-height) - 32px);
  }
}

.filter ::v-deep .unlabeled-select:not(.view):hover .vs__dropdown-menu {
  background: var(--dropdown-bg);
}

.filter ::v-deep .unlabeled-select {
  background-color: transparent;
}

.filter ::v-deep .unlabeled-select:not(.focused) {
  border: 0;
  min-height: 0;
}

.filter ::v-deep .unlabeled-select INPUT[type='search'] {
  width: auto;
}

.filter ::v-deep .unlabeled-select INPUT:hover {
  background-color: transparent;
}
</style>
