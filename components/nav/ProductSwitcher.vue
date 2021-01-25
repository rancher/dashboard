<script>
import { mapGetters } from 'vuex';
import { insertAt, findBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';
import { createPopper } from '@popperjs/core';
import $ from 'jquery';
import { CATALOG } from '@/config/types';
import Select from '@/components/form/Select';

export default {
  components: { Select },

  data() {
    return { previous: null };
  },

  computed: {
    ...mapGetters(['clusterId']),
    ...mapGetters('type-map', ['activeProducts']),

    value: {
      get() {
        return this.$store.getters['productId'];
      },
    },

    options() {
      const t = this.$store.getters['i18n/t'];
      const isMultiCluster = this.$store.getters['isMultiCluster'];

      const entries = this.activeProducts.map((p) => {
        let label;
        const key = `product.${ p.name }`;

        if ( this.$store.getters['i18n/exists'](key) ) {
          label = t(key);
        } else {
          label = ucFirst(p.name);
        }

        const out = {
          label,
          icon:      `icon-${ p.icon || 'copy' }`,
          value:     p.name,
          removable: p.removable !== false,
          inStore:   p.inStore || 'cluster',
          weight:    p.weight || 1,
        };

        if ( p.externalLink ) {
          out.kind = 'external';
          out.link = p.externalLink;
        } else if ( p.link ) {
          out.kind = 'internal';
          out.link = p.link;
        } else {
          out.kind = 'internal';
        }

        return out;
      });

      const out = sortBy(entries, ['inStore', 'weight:desc', 'label']);

      if ( isMultiCluster && out[0].inStore === 'cluster' ) {
        insertAt(out, 0, {
          label:    t('product.clusterGroup'),
          disabled: true,
          kind:     'label',
        });
      }

      let last;

      for ( let i = out.length - 1 ; i >= 0 ; i-- ) {
        const entry = out[i];

        if ( isMultiCluster && last && (last.inStore !== entry.inStore) ) {
          insertAt(out, i + 1, {
            label:    t('product.globalGroup'),
            disabled: true,
            kind:     'label',
          });

          insertAt(out, i + 1, {
            label:    `The great divide ${ i }`,
            kind:     'divider',
            disabled: true
          });

          break;
        }

        last = out[i];
      }

      return out;
    },
  },

  methods: {
    focus() {
      this.$refs.select.focusSearch();
    },

    shortcutsActive() {
      const forms = $('FORM');

      return forms.length === 0;
    },

    switchToApps() {
      if ( !this.shortcutsActive() ) {
        return;
      }

      this.change('apps', 'c-cluster-product-resource', { resource: CATALOG.APP });
    },

    switchToExplorer() {
      if ( !this.shortcutsActive() ) {
        return;
      }

      this.change('explorer');
    },

    switchToFleet() {
      if ( !this.shortcutsActive() ) {
        return;
      }

      this.change('fleet');
    },

    change(product, route = '', moreParams = {}) {
      const entry = findBy(this.options, 'value', product);

      if ( !entry ) {
        return;
      }

      if ( entry?.link ) {
        if ( entry.kind === 'external' ) {
          let windowName = '_blank';

          // Non-removable external links (MCM) go to a named window
          if ( entry.removable === false ) {
            windowName = `R_${ product }`;
          }

          window.open(entry.link, windowName);
          this.value = this.previous;

          return;
        } else {
          window.location.href = entry.link;
        }
      }

      this.previous = this.value;

      // Try product-specific index first
      const opt = {
        name:   route || `c-cluster-${ product }`,
        params: {
          cluster: this.clusterId,
          product,
          ...moreParams
        }
      };

      if ( !this.$router.getMatchedComponents(opt).length ) {
        opt.name = 'c-cluster-product';
      }

      this.$router.push(opt);
    },

    withPopper(dropdownList, component, { width }) {
      dropdownList.className += ' product-menu';

      const popper = createPopper(component.$refs.toggle, dropdownList, {
        strategy:  'fixed',
        modifiers: [
          {
            name:    'offset',
            options: { offset: [0, -2] },
          },
          {
            name:    'toggleClass',
            enabled: true,
            phase:   'write',
            fn({ state }) {
              component.$el.setAttribute('x-placement', state.placement);
            },
          }]
      });

      return () => popper.destroy();
    },
  },
};

</script>

<template>
  <div class="filter">
    <Select
      ref="select"
      key="product"
      :value="value"
      :selectable="option => !option.disabled"
      :options="options"
      :reduce="opt=>opt.value"
      :popper-override="withPopper"
      :append-to-body="true"
      placement="bottom"
      @input="change"
    >
      <template v-slot:option="opt">
        <template v-if="opt.kind === 'divider'">
          <hr />
        </template>
        <template v-else-if="opt.kind === 'label'">
          <b>{{ opt.label }}</b>
        </template>
        <template v-else>
          <i class="product-icon icon icon-lg icon-fw" :class="{[opt.icon]: true}" />
          {{ opt.label }}
          <i v-if="opt.kind === 'external'" class="icon icon-external-link ml-10" />
        </template>
      </template>
    </Select>
    <button v-shortkey.once="['p']" class="hide" @shortkey="focus()" />
    <button v-shortkey.once="['f']" class="hide" @shortkey="switchToFleet()" />
    <button v-shortkey.once="['e']" class="hide" @shortkey="switchToExplorer()" />
    <button v-shortkey.once="['a']" class="hide" @shortkey="switchToApps($event)" />
  </div>
</template>

<style lang="scss" scoped>
.filter ::v-deep .unlabeled-select {
  background-color: transparent;
  min-height: 50px;
  border: 0;

  .v-select {
    &.vs--disabled .vs__actions {
      display: none;
    }

    .vs__actions {
      &:after {
        fill: white !important;
        color: white !important;
      }
    }

    .vs__dropdown-toggle {
      // margin-bottom: -4px;
      height: var(--header-height);
      background-color: transparent;
      position: relative;
      padding-top: 0;
    }

    .vs__selected {
      user-select: none;
      cursor: default;
      color: white;
      line-height: calc(var(--header-height) - 7px);
      position: relative;
      left: 40px;
      align-self: center;
    }
    .vs__selected-options {
      flex-wrap: wrap;
    }
    .unlabeled-select INPUT[type='search'] {
      margin-left: 40px;
    }
  }
}
</style>

<style lang="scss">
// these styles exist because the dd is placed with Popper and is outside the flow of the component, product-menu gets appended to the menu
.product-menu {
  width: 300px;
  max-height: 90vh;
  &.vs__dropdown-menu {
    outline: none;
  }

  .vs__dropdown-option {
    padding: 10px;
    text-decoration: none;
    border-left: 5px solid transparent;

    &.vs__dropdown-option--disabled {
      // The dividers
      padding: 0;
    }

    .product-icon {
      color: var(--product-icon);
      margin-right: 5px;
    }

    UL {
      margin: 0;
    }
  }

  .vs__dropdown-option--selected {
    color: var(--body-text);
    background: var(--nav-active);
    border-left: 5px solid var(--primary);

    .product-icon {
      color: var(--product-icon-active);
    }
  }
}
</style>
