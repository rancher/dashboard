<script>
import { mapGetters } from 'vuex';
import { NAMESPACE_FILTERS } from '@shell/store/prefs';
import { NAMESPACE, MANAGEMENT } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import { isArray, addObjects, findBy, filterBy } from '@shell/utils/array';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/product/harvester-manager';
import {
  NAMESPACE_FILTER_SPECIAL as SPECIAL,
  NAMESPACE_FILTER_ALL_USER as ALL_USER,
  NAMESPACE_FILTER_ALL as ALL,
  NAMESPACE_FILTER_ALL_SYSTEM as ALL_SYSTEM,
  NAMESPACE_FILTER_ALL_ORPHANS as ALL_ORPHANS,
  NAMESPACE_FILTER_NAMESPACED_YES as NAMESPACED_YES,
  NAMESPACE_FILTER_NAMESPACED_NO as NAMESPACED_NO,
  createNamespaceFilterKey,
} from '@shell/utils/namespace-filter';
import { KEY } from '@shell/utils/platform';

export default {
  data() {
    return {
      isOpen:        false,
      filter:        '',
      hidden:        0,
      total:         0,
      activeElement: null,
    };
  },

  computed: {
    ...mapGetters(['isVirtualCluster', 'isMultiVirtualCluster', 'currentProduct']),

    hasFilter() {
      return this.filter.length > 0;
    },

    filtered() {
      let out = this.options;

      // Filter by the current filter
      if (this.hasFilter) {
        out = out.filter((item) => {
          return item.kind !== SPECIAL && item.label.toLowerCase().includes(this.filter.toLowerCase());
        });
      }

      const mapped = this.value.reduce((m, v) => {
        m[v.id] = v;

        return m;
      }, {});

      // Mark all of the selected options
      out.forEach((i) => {
        i.selected = !!mapped[i.id] || (i.id === ALL && this.value && this.value.length === 0);
        i.elementId = (i.id || '').replace('://', '_');
      });

      return out;
    },

    tooltip() {
      if (this.isOpen || (this.total + this.hidden) === 0) {
        return null;
      }

      let tooltip = '<div class="ns-filter-tooltip">';

      (this.value || []).forEach((v) => {
        tooltip += `<div class="ns-filter-tooltip-item"><div>${ v.label }</div></div>`;
      });

      tooltip += '</div>';

      return {
        content:   tooltip,
        placement: 'bottom',
        delay:     { show: 500 }
      };
    },

    key() {
      return createNamespaceFilterKey(this.$store.getters['clusterId'], this.currentProduct);
    },

    options() {
      const t = this.$store.getters['i18n/t'];
      let out = [];

      if (this.currentProduct.customNamespaceFilter) {
        // Sometimes the component can show before the 'currentProduct' has caught up, so access the product via the getter rather
        // than caching it in the `fetch`
        return this.$store.getters[`${ this.currentProduct.inStore }/namespaceFilterOptions`]({
          addNamespace,
          divider
        });
      }

      if (!this.isVirtualCluster) {
        out = [
          {
            id:    ALL,
            kind:  SPECIAL,
            label: t('nav.ns.all'),
          },
          {
            id:    ALL_USER,
            kind:  SPECIAL,
            label: t('nav.ns.user'),
          },
          {
            id:    ALL_SYSTEM,
            kind:  SPECIAL,
            label: t('nav.ns.system'),
          },
          {
            id:    NAMESPACED_YES,
            kind:  SPECIAL,
            label: t('nav.ns.namespaced'),
          },
          {
            id:    NAMESPACED_NO,
            kind:  SPECIAL,
            label: t('nav.ns.clusterLevel'),
          },
        ];

        divider(out);
      }

      const inStore = this.$store.getters['currentStore'](NAMESPACE);
      const namespaces = sortBy(
        this.$store.getters[`${ inStore }/all`](NAMESPACE),
        ['nameDisplay']
      ).filter( (N) => {
        const isSettingSystemNamespace = this.$store.getters['systemNamespaces'].includes(N.metadata.name);

        const needFilter = !N.isSystem && !N.isFleetManaged && !isSettingSystemNamespace;
        const isVirtualProduct = this.$store.getters['currentProduct'].name === HARVESTER;

        return this.isVirtualCluster && isVirtualProduct ? needFilter : true;
      });

      if (this.$store.getters['isRancher'] || this.isMultiVirtualCluster) {
        const cluster = this.$store.getters['currentCluster'];
        let projects = this.$store.getters['management/all'](
          MANAGEMENT.PROJECT
        );

        projects = sortBy(filterBy(projects, 'spec.clusterName', cluster.id), [
          'nameDisplay',
        ]);
        const projectsById = {};
        const namespacesByProject = {};
        let firstProject = true;

        namespacesByProject[null] = []; // For namespaces not in a project
        for (const project of projects) {
          projectsById[project.metadata.name] = project;
        }

        for (const namespace of namespaces) {
          let projectId = namespace.projectId;

          if (!projectId || !projectsById[projectId]) {
            // If there's a projectId but that project doesn't exist, treat it like no project
            projectId = null;
          }

          let entry = namespacesByProject[projectId];

          if (!entry) {
            entry = [];
            namespacesByProject[namespace.projectId] = entry;
          }
          entry.push(namespace);
        }

        for (const project of projects) {
          const id = project.metadata.name;

          if (firstProject) {
            firstProject = false;
          } else {
            divider(out);
          }

          out.push({
            id:    `project://${ id }`,
            kind:  'project',
            label: t('nav.ns.project', { name: project.nameDisplay }),
          });

          const forThisProject = namespacesByProject[id] || [];

          addNamespace(out, forThisProject);
        }

        const orphans = namespacesByProject[null];

        if (orphans.length) {
          if (!firstProject) {
            divider(out);
          }

          out.push({
            id:       ALL_ORPHANS,
            kind:     'project',
            label:    t('nav.ns.orphan'),
            disabled: true,
          });

          addNamespace(out, orphans);
        }
      } else {
        addNamespace(out, namespaces);
      }

      return out;

      function addNamespace(out, namespaces) {
        if (!isArray(namespaces)) {
          namespaces = [namespaces];
        }

        addObjects(
          out,
          namespaces.map((namespace) => {
            return {
              id:    `ns://${ namespace.id }`,
              kind:  'namespace',
              label: t('nav.ns.namespace', { name: namespace.nameDisplay }),
            };
          })
        );
      }

      function divider(out) {
        out.push({
          kind:     'divider',
          label:    `Divider ${ out.length }`,
          disabled: true,
        });
      }
    },

    isSingleSpecial() {
      return this.value && this.value.length === 1 && this.value[0].kind === 'special';
    },

    value: {
      get() {
        const prefs = this.$store.getters['prefs/get'](NAMESPACE_FILTERS);
        const prefDefault = this.currentProduct.customNamespaceFilter ? [] : [ALL_USER];
        const values = prefs[this.key] || prefDefault;
        const options = this.options;

        // Remove values that are not valid options
        const out = values
          .map((value) => {
            return findBy(options, 'id', value);
          })
          .filter(x => !!x);

        return out;
      },

      set(neu) {
        const old = (this.value || []).slice();

        neu = neu.filter(x => !!x.id);

        const last = neu[neu.length - 1];
        const lastIsSpecial = last?.kind === SPECIAL;
        const hadUser = !!old.find(x => x.id === ALL_USER);
        const hadAll = !!old.find(x => x.id === ALL);

        if (lastIsSpecial) {
          neu = [last];
        }

        if (neu.length > 1) {
          neu = neu.filter(x => x.kind !== SPECIAL);
        }

        if (neu.find(x => x.id === 'all')) {
          neu = [];
        }

        let ids;

        // If there was something selected and you remove it, go back to user by default
        // Unless it was user or all
        if (neu.length === 0 && !hadUser && !hadAll) {
          ids = this.currentProduct.customNamespaceFilter ? [] : [ALL_USER];
        } else {
          ids = neu.map(x => x.id);
        }

        this.$nextTick(() => {
          this.$store.dispatch('switchNamespaces', {
            ids,
            key: this.key
          });
        });
      },
    }
  },

  beforeDestroy() {
    this.removeCloseKeyHandler();
  },

  mounted() {
    this.layout();
  },

  watch: {
    value(neu) {
      this.layout();
    }
  },

  methods: {
    // Layout the content in the dropdown box to best use the space to show the selection
    layout() {
      this.$nextTick(() => {
        // One we have re-rendered, see what we can fit in the control to show the selected namespaces
        if (this.$refs.values) {
          const container = this.$refs.values;
          const overflow = container.scrollWidth > container.offsetWidth;
          let hidden = 0;

          const dropdown = this.$refs.dropdown;
          // Remove padding and dropdown arrow size
          const maxWidth = dropdown.offsetWidth - 20 - 24;

          // If we are overflowing, then allow some space for the +N indicator
          const itemCount = this.$refs.value ? this.$refs.value.length : 0;
          let currentWidth = 0;
          let show = true;

          this.total = 0;

          for (let i = 0; i < itemCount; i++) {
            const item = this.$refs.value[i];
            let itemWidth = item.offsetWidth + 10;

            // If this is the first item and we have overflow then add on some space for the +N
            if (i === 0 && overflow) {
              itemWidth += 40;
            }

            currentWidth += itemWidth;

            if (show) {
              if (i === 0) {
                // Can't even fit the first item in
                if (itemWidth > maxWidth) {
                  show = false;
                  this.total = this.value.length;
                }
              } else {
                show = currentWidth < maxWidth;
              }
            }

            hidden += show ? 0 : 1;
            item.style.visibility = show ? 'visible' : 'hidden';
          }

          this.hidden = this.total > 0 ? 0 : hidden;
        }
      });
    },
    addCloseKeyHandler() {
      document.addEventListener('keyup', this.closeKeyHandler);
    },
    removeCloseKeyHandler() {
      document.removeEventListener('keyup', this.closeKeyHandler);
    },
    closeKeyHandler(e) {
      if (e.keyCode === KEY.ESCAPE ) {
        this.close();
      }
    },
    // Keyboard support
    itemKeyHandler(e, opt) {
      if (e.keyCode === KEY.DOWN ) {
        e.preventDefault();
        e.stopPropagation();
        this.down();
      } else if (e.keyCode === KEY.UP ) {
        e.preventDefault();
        e.stopPropagation();
        this.up();
      } else if (e.keyCode === KEY.SPACE) {
        e.preventDefault();
        e.stopPropagation();
        this.selectOption(opt);
        e.target.focus();
      }
    },
    inputKeyHandler(e) {
      if (e.keyCode === KEY.DOWN ) {
        e.preventDefault();
        e.stopPropagation();
        this.down(true);
      } else if (e.keyCode === KEY.TAB) {
        // Tab out of the input box
        this.close();
        e.target.blur();
      }
    },
    mouseOver(event) {
      const el = event?.path?.find(e => e.classList.contains('ns-option'));

      this.activeElement = el;
    },
    setActiveElement(el) {
      if (!el?.focus) {
        return;
      }

      el.focus();
      this.activeElement = null;
    },
    down(input) {
      const exising = this.activeElement || document.activeElement;

      // Focus the first element in the list
      if (input || !exising) {
        if (this.$refs.options) {
          const c = this.$refs.options.children;

          if (c && c.length > 0) {
            this.setActiveElement(c[0]);
          }
        }
      } else {
        let next = exising.nextSibling;

        if (next?.children?.length) {
          const item = next.children[0];

          // Skip over dividers (assumes we don't have two dividers next to each other)
          if (item.classList.contains('ns-divider')) {
            next = next.nextSibling;
          }
        }

        if (next?.focus) {
          this.setActiveElement(next);
        }
      }
    },
    up() {
      if (document.activeElement) {
        let prev = document.activeElement.previousSibling;

        if (prev?.children?.length) {
          const item = prev.children[0];

          if (item.classList.contains('ns-divider')) {
            prev = prev.previousSibling;
          }
        }

        if (prev?.focus) {
          this.setActiveElement(prev);
        }
      }
    },
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
    open() {
      this.isOpen = true;
      this.$nextTick(() => {
        this.$refs.filter.focus();
      });
      this.addCloseKeyHandler();
      this.layout();
    },
    close() {
      this.isOpen = false;
      this.activeElement = null;
      this.removeCloseKeyHandler();
      this.layout();
    },
    clear() {
      this.value = [];
    },
    selectOption(option) {
      // Ignore click for a divider
      if (option.kind === 'divider') {
        return;
      }

      const current = this.value;
      const exists = current.findIndex(v => v.id === option.id);

      // Remove if it exists, add if it does not
      if (exists !== -1) {
        current.splice(exists, 1);
      } else {
        current.push(option);
      }

      this.value = current;

      if (document.activeElement) {
        document.activeElement.blur();
      }
    },
    removeOption(ns, event) {
      this.selectOption(ns);
      event.preventDefault();
      event.stopPropagation();
    }
  }
};
</script>

<template>
  <div class="ns-filter" tabindex="0" @focus="open()">
    <div v-if="isOpen" class="ns-glass" @click="close()"></div>
    <!-- Dropdown control -->
    <div ref="dropdown" class="ns-dropdown" :class="{ 'ns-open': isOpen }" @click="toggle()">
      <div v-if="value.length === 0" ref="values" class="ns-values">
        {{ t('nav.ns.all') }}
      </div>
      <div v-else-if="isSingleSpecial" ref="values" class="ns-values">
        {{ value[0].label }}
      </div>
      <div v-else ref="values" v-tooltip="tooltip" class="ns-values">
        <div v-if="total" ref="total" class="ns-value ns-abs">
          {{ t('namespaceFilter.selected.label', { total }) }}
        </div>
        <div v-for="ns in value" ref="value" :key="ns.id" class="ns-value">
          <div>{{ ns.label }}</div>
          <i class="icon icon-close" @click="removeOption(ns, $event)" />
        </div>
      </div>
      <div v-if="hidden > 0" ref="more" v-tooltip="tooltip" class="ns-more">
        {{ t('namespaceFilter.more', { more: hidden }) }}
      </div>
      <i v-if="!isOpen" class="icon icon-chevron-down" />
      <i v-else class="icon icon-chevron-up" />
    </div>
    <button v-shortkey.once="['n']" class="hide" @shortkey="open()" />
    <div v-if="isOpen" class="ns-dropdown-menu">
      <div class="ns-controls">
        <div class="ns-input">
          <input ref="filter" v-model="filter" tabindex="0" class="ns-filter-input" @keydown="inputKeyHandler($event)" />
          <i v-if="hasFilter" class="ns-filter-clear icon icon-close" @click="filter = ''" />
        </div>
        <div class="ns-clear">
          <i class="icon icon-close" @click="clear()" />
        </div>
      </div>
      <div class="ns-divider mt-0"></div>
      <div ref="options" class="ns-options" role="list">
        <div
          v-for="opt in filtered"
          :id="opt.elementId"
          :key="opt.id"
          tabindex="0"
          class="ns-option"
          :class="{'ns-selected': opt.selected}"
          @click="selectOption(opt)"
          @mouseover="mouseOver($event)"
          @keydown="itemKeyHandler($event, opt)"
        >
          <div v-if="opt.kind === 'divider'" class="ns-divider"></div>
          <div v-else class="ns-item">
            <i v-if="opt.kind === 'namespace'" class="icon icon-folder" />
            <div>{{ opt.label }}</div>
            <i v-if="opt.selected" class="icon icon-checkmark" />
          </div>
        </div>
        <div v-if="filtered.length === 0" class="ns-none">
          {{ t('namespaceFilter.noMatchingOptions') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $ns_dropdown_size: 24px;

  .ns-abs {
    position: absolute;
  }

  .ns-filter {
    width: 280px;
    display: inline-block;

    $glass-z-index: 2;
    $dropdown-z-index: 1000;

    .ns-glass {
      height: 100vh;
      left: 0;
      opacity: 0;
      position: absolute;
      top: 0;
      width: 100vw;
      z-index: $glass-z-index;
    }

    .ns-controls {
      align-items: center;
      display: flex;
    }

    .ns-clear {
      align-items: center;
      display: flex;
      > i {
        font-size: 24px;
        padding: 0 5px;
      }

      &:hover {
        color: var(--link);
        cursor: pointer;
      }
    }

    .ns-input {
      flex: 1;
      padding: 5px;
      position: relative;
    }

    .ns-filter-input {
      height: 24px;
    }

    .ns-filter-clear {
      cursor: pointer;
      position: absolute;
      right: 10px;
      top: 5px;
      font-size: 16px;
      line-height: 24px;
      text-align: center;
      width: 24px;
    }

    .ns-dropdown-menu {
      background-color: var(--header-bg);
      border: 1px solid var(--link-border);
      border-bottom-left-radius: var(--border-radius);
      border-bottom-right-radius: var(--border-radius);
      color: var(--header-btn-text);
      margin-top: -1px;
      padding-bottom: 10px;
      position: relative;
      z-index: $dropdown-z-index;

      .ns-options {
        max-height: 50vh;
        overflow-y: auto;

        .ns-none {
          color: var(--muted);
          padding: 0 10px;
        }
      }

      .ns-divider {
        border-top: 1px solid var(--border);
        cursor: default;
        margin-top: 10px;
        padding-bottom: 10px;
      }

      .ns-option:focus {
        background-color: var(--dropdown-hover-bg);
        color: var(--dropdown-hover-text);
      }

      .ns-option {
        .ns-item {
          align-items: center;
          display: flex;
          height: 24px;
          line-height: 24px;
          padding: 0 10px;

          > i {
            color: var(--muted);
            margin: 0 5px;
          }

          > div {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          &:hover, &:focus {
            background-color: var(--dropdown-hover-bg);
            color: var(--dropdown-hover-text);
            cursor: pointer;

            > i {
              color: var(--dropdown-hover-text);
            }
          }
        }
      &.ns-selected:not(:hover) {
        .ns-item {
          > * {
            color: var(--dropdown-hover-bg);
          }
        }
      }
      &.ns-selected {
        &:hover,&:focus {
          .ns-item {
            > * {
              background-color: var(--dropdown-hover-bg);
              color: var(--dropdown-hover-text);
            }
          }
        }
      }

      }
    }

    .ns-dropdown {
      align-items: center;
      display: flex;
      border: 1px solid var(--header-border);
      border-radius: var(--border-radius);
      color: var(--header-btn-text);
      cursor: pointer;
      height: 40px;
      padding: 0 10px;
      position: relative;
      z-index: $dropdown-z-index;

      &.ns-open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-color: var(--link-border);
      }

      > .ns-values {
        flex: 1;
      }

      &:hover {
        > i {
          color: var(--link);
        }
      }

      > i {
        height: $ns_dropdown_size;
        width: $ns_dropdown_size;
        font-size: 20px;
        cursor: pointer;
        text-align: center;
        line-height: $ns_dropdown_size;
      }

      .ns-more {
        border: 1px solid var(--header-border);
        border-radius: 5px;
        padding: 2px 8px;
        margin-left: 4px;
      }

      .ns-values {
        display: flex;
        overflow: hidden;

        .ns-value {
          align-items: center;
          background-color: rgba(0,0,0,.05);
          border: 1px solid var(--header-border);
          border-radius: 5px;
          color: var(--tag-text);
          display: flex;
          line-height: 20px;
          padding: 2px 5px;
          white-space: nowrap;

          > i {
            margin-left: 5px;

            &:hover {
              color: var(--link);
            };
          }

          // Spacing between tags
          &:not(:last-child) {
            margin-right: 5px;
          }
        }
      }
    }
  }
</style>
<style lang="scss">
  .tooltip {
    .ns-filter-tooltip {
      background-color: var(--body-bg);
      margin: -6px;
      padding: 6px;

      .ns-filter-tooltip-item {
        > div {
          background-color: rgba(0,0,0,.05);
          border: 1px solid var(--header-border);
          border-radius: 5px;
          color: var(--tag-text);
          display: inline-block;
          line-height: 20px;
          padding: 2px 5px;
          white-space: nowrap;
          margin: 4px 0;
        }
      }
    }
  }
</style>
