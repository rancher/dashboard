<script>
import { mapGetters } from 'vuex';
import { NAMESPACE_FILTERS, ALL_NAMESPACES } from '@shell/store/prefs';
import { NAMESPACE, MANAGEMENT } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import { isArray, addObjects, findBy, filterBy } from '@shell/utils/array';
import {
  NAMESPACE_FILTER_ALL_USER as ALL_USER,
  NAMESPACE_FILTER_ALL as ALL,
  NAMESPACE_FILTER_ALL_SYSTEM as ALL_SYSTEM,
  NAMESPACE_FILTER_ALL_ORPHANS as ALL_ORPHANS,
  NAMESPACE_FILTER_NAMESPACED_YES as NAMESPACED_YES,
  NAMESPACE_FILTER_NAMESPACED_NO as NAMESPACED_NO,
  createNamespaceFilterKey,
  NAMESPACE_FILTER_KINDS,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
  NAMESPACE_FILTER_P_FULL_PREFIX,
} from '@shell/utils/namespace-filter';
import { KEY } from '@shell/utils/platform';
import pAndNFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';
import { SETTING } from '@shell/config/settings';
import paginationUtils from '@shell/utils/pagination-utils';
import { randomStr } from '@shell/utils/string';
import { RcButton } from '@components/RcButton';

const forcedNamespaceValidTypes = [NAMESPACE_FILTER_KINDS.DIVIDER, NAMESPACE_FILTER_KINDS.PROJECT, NAMESPACE_FILTER_KINDS.NAMESPACE];

export default {

  components: { RcButton },

  data() {
    return {
      isOpen:              false,
      filter:              '',
      hidden:              0,
      total:               0,
      activeElement:       null,
      cachedFiltered:      [],
      NAMESPACE_FILTER_KINDS,
      namespaceFilterMode: undefined,
      containerId:         `dropdown-${ randomStr() }`,
    };
  },

  async fetch() {
    // Determine if filtering by specific namespaces/projects is required
    // This is done once and up front
    // - it doesn't need to be re-active
    // - added it as a computed caused massive amounts of churn around the `filtered` watcher
    await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.UI_PERFORMANCE });
    this.namespaceFilterMode = this.calcNamespaceFilterMode();
  },

  computed: {
    ...mapGetters(['currentProduct']),

    hasFilter() {
      return this.filter.length > 0;
    },

    paginatedListFilterMode() {
      return this.$store.getters[`${ this.currentProduct.inStore }/paginationEnabled`](this.$route.params?.resource) ? paginationUtils.validNsProjectFilters : null;
    },

    /**
     * Create visible options (filtered version of `options`)
     */
    filtered() {
      let out = this.options;

      out = out.filter((item) => {
        // Filter out anything not applicable to singleton selection
        if (this.namespaceFilterMode?.length) {
          // We always show dividers, projects and namespaces
          if (!forcedNamespaceValidTypes.includes(item.kind)) {
            const validCustomType = this.namespaceFilterMode.find((prefix) => item.kind.startsWith(prefix));

            if (!validCustomType) {
              // Hide any invalid option that's not selected
              return this.value.findIndex((v) => v.id === item.id) >= 0;
            }
          }
        }

        // Filter by the current filter
        if (this.hasFilter) {
          return item.kind !== NAMESPACE_FILTER_KINDS.SPECIAL && item.label.toLowerCase().includes(this.filter.toLowerCase());
        }

        return true;
      });

      if (out?.[0]?.kind === NAMESPACE_FILTER_KINDS.DIVIDER) {
        out.splice(0, 1);
      }

      const mapped = this.value.reduce((m, v) => {
        m[v.id] = v;

        return m;
      }, {});

      // Mark all of the selected options
      out.forEach((i) => {
        i.selected = !!mapped[i.id] || (i.id === ALL && this.value && this.value.length === 0);
        i.elementId = (i.id || '').replace('://', '_');
        i.enabled = true;
        // Are we in restricted resource type mode, if so is this an allowed type?
        if (this.namespaceFilterMode?.length) {
          const isLastSelected = i.selected && (i.id === ALL || this.value.length === 1);
          const kindAllowed = this.namespaceFilterMode.find((f) => f === i.kind);
          const isNotInProjectGroup = i.id === ALL_ORPHANS;

          i.enabled = (!isLastSelected && kindAllowed) && !isNotInProjectGroup;
        } else if (this.paginatedListFilterMode?.length) {
          i.enabled = !!i.id && paginationUtils.validateNsProjectFilter(i.id);
        }
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

    /**
     * Create options (see `filtered` for visible collection)
     */
    options() {
      const t = this.$store.getters['i18n/t'];
      let out = [];
      const inStore = this.$store.getters['currentStore'](NAMESPACE);

      const params = { ...this.$route.params };
      const resource = params.resource;

      // Sometimes, different pages may have different namespaces to filter
      const notFilterNamespaces = this.$store.getters[`type-map/optionsFor`](resource).notFilterNamespace || [];

      // TODO: Add return info
      if (this.currentProduct?.customNamespaceFilter && this.currentProduct?.inStore) {
        // Sometimes the component can show before the 'currentProduct' has caught up, so access the product via the getter rather
        // than caching it in the `fetch`

        // The namespace display on the list and edit pages should be the same as in the namespaceFilter component
        if (this.$store.getters[`${ this.currentProduct.inStore }/filterNamespace`]) {
          const allNamespaces = this.$store.getters[`${ this.currentProduct.inStore }/filterNamespace`](notFilterNamespaces);

          this.$store.commit('changeAllNamespaces', allNamespaces);
        }

        return this.$store.getters[`${ this.currentProduct.inStore }/namespaceFilterOptions`]({
          addNamespace,
          divider,
          notFilterNamespaces
        });
      }

      // TODO: Add return info
      if (!this.currentProduct?.hideSystemResources) {
        out = [
          {
            id:    ALL,
            kind:  NAMESPACE_FILTER_KINDS.SPECIAL,
            label: t('nav.ns.all'),
          },
          {
            id:    ALL_USER,
            kind:  NAMESPACE_FILTER_KINDS.SPECIAL,
            label: t('nav.ns.user'),
          },
          {
            id:    ALL_SYSTEM,
            kind:  NAMESPACE_FILTER_KINDS.SPECIAL,
            label: t('nav.ns.system'),
          },
          {
            id:    NAMESPACED_YES,
            kind:  NAMESPACE_FILTER_KINDS.SPECIAL,
            label: t('nav.ns.namespaced'),
          },
          {
            id:    NAMESPACED_NO,
            kind:  NAMESPACE_FILTER_KINDS.SPECIAL,
            label: t('nav.ns.clusterLevel'),
          },
        ];

        divider(out);
      }

      if (!inStore) {
        return out;
      }

      let namespaces = sortBy(
        this.$store.getters[`${ inStore }/all`](NAMESPACE),
        ['nameDisplay']
      );

      namespaces = this.filterNamespaces(namespaces);

      // isRancher = mgmt schemas are loaded and there's a project schema
      if (this.$store.getters['isRancher']) {
        const cluster = this.$store.getters['currentCluster'];
        let projects = this.$store.getters['management/all'](
          MANAGEMENT.PROJECT
        );

        projects = projects.filter((p) => {
          return this.currentProduct?.hideSystemResources ? !p.isSystem && p.spec.clusterName === cluster.id : p.spec.clusterName === cluster.id;
        });
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
            id:    `${ NAMESPACE_FILTER_P_FULL_PREFIX }${ id }`,
            kind:  NAMESPACE_FILTER_KINDS.PROJECT,
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
            kind:     NAMESPACE_FILTER_KINDS.PROJECT,
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
              id:    `${ NAMESPACE_FILTER_NS_FULL_PREFIX }${ namespace.id }`,
              kind:  NAMESPACE_FILTER_KINDS.NAMESPACE,
              label: t('nav.ns.namespace', { name: namespace.nameDisplay }),
            };
          })
        );
      }

      function divider(out) {
        out.push({
          kind:     NAMESPACE_FILTER_KINDS.DIVIDER,
          label:    `Divider ${ out.length }`,
          disabled: true,
        });
      }
    },

    isSingleSpecial() {
      return this.value && this.value.length === 1 && this.value[0].kind === NAMESPACE_FILTER_KINDS.SPECIAL;
    },

    value: {
      get() {
        // Use last picked filter from user preferences
        const prefs = this.$store.getters['prefs/get'](NAMESPACE_FILTERS);
        const values = prefs && prefs[this.key] ? prefs[this.key] : this.defaultOption();
        const options = this.options;

        // Remove values that are not valid options
        const filters = values
          .map((value) => {
            return findBy(options, 'id', value);
          })
          .filter((x) => !!x);

        if (filters.length !== values.length) {
          // filter has changed, ensure we persist these to store
          this.value = filters;
        }

        return filters;
      },

      set(neu) {
        const old = (this.value || []).slice();

        neu = neu.filter((x) => !!x.id);

        const last = neu[neu.length - 1];
        const lastIsSpecial = last?.kind === NAMESPACE_FILTER_KINDS.SPECIAL;
        const hadUser = !!old.find((x) => x.id === ALL_USER);
        const hadAll = !!old.find((x) => x.id === ALL);

        if (lastIsSpecial) {
          neu = [last];
        }

        if (neu.length > 1) {
          neu = neu.filter((x) => x.kind !== NAMESPACE_FILTER_KINDS.SPECIAL);
        }

        if (neu.find((x) => x.id === 'all')) {
          neu = [];
        }

        let ids;

        // If there was something selected and you remove it, go back to user by default
        // Unless it was user or all
        if (neu.length === 0 && !hadUser && !hadAll) {
          ids = this.defaultOption();
        } else {
          ids = neu.map((x) => x.id);
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

  mounted() {
    this.layout();
  },

  watch: {
    value(neu) {
      this.layout();
    },

    /**
     * When there are thousands of entries certain actions (drop down opened, selection changed, etc) take a long time to complete (upwards
     * of 5 seconds)
     *
     * This is caused by churn of the filtered and options computed properties causing multiple renders for each action.
     *
     * To break this multiple-render per cycle behaviour detach `filtered` from the value used in `v-for`.
     *
     */
    filtered(neu) {
      if (!!neu) {
        this.cachedFiltered = neu;
      }
    }
  },

  methods: {
    filterNamespaces(namespaces) {
      if (this.$store.getters['prefs/get'](ALL_NAMESPACES)) {
        // If all namespaces options are turned on in the user preferences,
        // return all namespaces including system namespaces and RBAC
        // management namespaces.
        return namespaces;
      }

      return namespaces.filter((namespace) => {
        // Otherwise only filter out obscure namespaces, such as namespaces
        // that Rancher uses to manage RBAC for projects, which should not be
        // edited or deleted by Rancher users.
        return !namespace.isObscure;
      });
    },
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
    // Keyboard support
    itemKeyHandler(e, opt) {
      if (e.keyCode === KEY.DOWN ) {
        e.preventDefault();
        e.stopPropagation();
        this.down();

        return;
      }

      if (e.keyCode === KEY.UP) {
        e.preventDefault();
        e.stopPropagation();
        this.up();

        return;
      }

      if (e.keyCode === KEY.SPACE || e.keyCode === KEY.CR) {
        if (this.namespaceFilterMode && !opt.enabled) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        this.selectOption(opt);
        e.target.focus();
      }
    },
    inputKeyHandler(e) {
      switch (e.keyCode) {
      case KEY.DOWN:
        e.preventDefault();
        e.stopPropagation();
        this.down(true);
        break;
      case KEY.ESCAPE:
        this.close();
        break;
      case KEY.CR:
        if (this.filtered.length === 1) {
          this.selectOption(this.filtered[0]);
          this.filter = '';
        }
        break;
      case KEY.TAB:
        if (e.shiftKey) {
          this.close();
        }
      }
    },
    mouseOver(event) {
      const el = event?.path?.find((e) => e.classList.contains('ns-option'));

      this.activeElement = el;
    },
    setActiveElement(el) {
      if (!el?.focus) {
        return;
      }

      el.focus();
      this.activeElement = null;
    },
    down(input, focusFirst = true) {
      const existing = this.activeElement || document.activeElement;

      // Focus the first element in the list
      if (input || (!existing && !focusFirst)) {
        if (this.$refs.options) {
          const c = this.$refs.options.children;

          if (c && c.length > 0) {
            this.setActiveElement(c[0]);
          }
        }
      } else {
        let next = existing.nextElementSibling;

        if (!next) {
          next = existing.parentNode.firstElementChild;
        }

        // Skip over dividers (assumes we don't have two dividers next to each other)
        if (next?.classList.contains('ns-divider')) {
          next = next.nextElementSibling;
        }

        if (next?.focus) {
          this.setActiveElement(next);
        }
      }
    },
    up() {
      const existing = this.activeElement || document.activeElement;

      if (existing) {
        let prev = document.activeElement.previousElementSibling;

        if (!prev) {
          prev = existing.parentNode.lastElementChild;
        }

        if (prev.classList.contains('ns-divider')) {
          prev = prev.previousElementSibling;
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
        this.focusFilter();
      });
      this.layout();
    },
    clearFilter() {
      this.filter = '';
      this.focusFilter();
    },
    focusFilter() {
      this.$refs.filterInput.focus();
    },
    close() {
      this.isOpen = false;
      this.activeElement = null;
      this.layout();
      this.$refs.namespaceFilterInput.focus();
    },
    clear() {
      this.value = [];
    },
    selectOption(option) {
      // Ignore click for a divider
      if (option.kind === NAMESPACE_FILTER_KINDS.DIVIDER) {
        return;
      }

      const current = this.value;

      // Remove invalid
      if (!!this.namespaceFilterMode?.length) {
        this.value.forEach((v) => {
          if (!this.namespaceFilterMode.find((f) => f === v.kind)) {
            const index = current.findIndex((c) => c.id === v.id);

            current.splice(index, 1);
          }
        });
      }

      const exists = current.findIndex((v) => v.id === option.id);

      // Remove if it exists (or always add if in singleton mode - we've reset the list above)
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
    handleValueMouseDown(ns, event) {
      this.removeOption(ns, event);

      if (this.value.length === 0) {
        this.open();
      }
    },

    removeOption(ns, event) {
      event.preventDefault();
      event.stopPropagation();

      this.selectOption(ns);

      if (event.type !== 'keydown' || this.value.length !== 0) {
        return;
      }

      this.$refs.namespaceFilterInput.focus();
    },

    defaultOption() {
      // Note - This is one place where a default ns/project filter value is provided (ALL_USER)
      // There's also..
      // - dashboard root store `loadCluster` --> when `updateNamespaces` is dispatched
      // - harvester root store `loadCluster` --> when `updateNamespaces` is dispatched (can be discarded)
      // Due to this, we can't really set a nicer default when forced ns/project filtering is on (ALL_USER is invalid)
      if (this.currentProduct?.customNamespaceFilter) {
        return [];
      }

      return [ALL_USER];
    },

    calcNamespaceFilterMode() {
      if (pAndNFiltering.isEnabled(this.$store.getters)) {
        return [NAMESPACE_FILTER_KINDS.NAMESPACE, NAMESPACE_FILTER_KINDS.PROJECT];
      }

      return null;
    },
  }
};
</script>

<template>
  <div
    v-if="!$fetchState.pending"
    ref="namespaceFilterInput"
    role="combobox"
    :aria-expanded="isOpen"
    :aria-activedescendant="containerId"
    class="ns-filter"
    data-testid="namespaces-filter"
    :aria-label="t('generic.namespaceFilter')"
    tabindex="0"
    @mousedown.prevent
    @keydown.self.down.enter.space.prevent="open"
  >
    <div
      v-if="isOpen"
      class="ns-glass"
      @click="close()"
    />

    <!-- Select Dropdown control -->
    <div
      :id="containerId"
      ref="dropdown"
      class="ns-dropdown"
      data-testid="namespaces-dropdown"
      :class="{ 'ns-open': isOpen }"
      @click="toggle()"
    >
      <!-- No filters found or available -->
      <div
        v-if="value.length === 0"
        ref="values"
        data-testid="namespaces-values-none"
        class="ns-values"
      >
        {{ t('nav.ns.all') }}
      </div>

      <!-- Filtered by set with custom label E.g. "All namespaces" -->
      <div
        v-else-if="isSingleSpecial"
        ref="values"
        data-testid="namespaces-values-label"
        class="ns-values"
      >
        {{ value[0].label }}
      </div>

      <!-- All the selected namespaces -->
      <div
        v-else
        ref="values"
        v-clean-tooltip="tooltip"
        data-testid="namespaces-values"
        class="ns-values"
      >
        <div
          v-if="total"
          ref="total"
          data-testid="namespaces-values-total"
          class="ns-value ns-abs"
        >
          {{ t('namespaceFilter.selected.label', { total }) }}
        </div>
        <div
          v-for="(ns, j) in value"
          ref="value"
          :key="ns.id"
          :data-testid="`namespaces-value-${j}`"
          class="ns-value"
        >
          <div>{{ ns.label }}</div>
          <!-- block user from removing the last selection if ns forced filtering is on -->
          <RcButton
            v-if="!namespaceFilterMode || value.length > 1"
            size="small"
            variant="ghost"
            class="ns-chip-button"
            :data-testid="`namespaces-values-close-${j}`"
            :aria-label="t('namespaceFilter.removeNamespace', { name: ns.label })"
            @click="removeOption(ns, $event)"
            @keydown.enter.space.stop="removeOption(ns, $event)"
            @mousedown="handleValueMouseDown(ns, $event)"
          >
            <i class="icon icon-close" />
          </RcButton>
        </div>
      </div>

      <!-- Inform user if more namespaces are selected -->
      <div
        v-if="hidden > 0"
        ref="more"
        v-clean-tooltip="tooltip"
        class="ns-more"
      >
        {{ t('namespaceFilter.more', { more: hidden }) }}
      </div>
      <i
        v-if="!isOpen"
        class="icon icon-chevron-down"
      />
      <i
        v-else
        class="icon icon-chevron-up"
      />
    </div>
    <button
      v-shortkey.once="['n']"
      class="hide"
      @shortkey="open()"
    />

    <!-- Dropdown menu -->
    <div
      v-if="isOpen"
      class="ns-dropdown-menu"
      data-testid="namespaces-menu"
    >
      <div class="ns-controls">
        <div
          class="ns-input"
          role="status"
          aria-live="polite"
        >
          <input
            ref="filterInput"
            v-model="filter"
            tabindex="0"
            class="ns-filter-input"
            :aria-label="t('namespaceFilter.input')"
            @mousedown.stop
            @click="focusFilter"
            @keydown="inputKeyHandler($event)"
          >
          <RcButton
            v-if="hasFilter"
            size="small"
            variant="ghost"
            class="ns-filter-clear"
            :aria-label="t('namespaceFilter.button.clearFilter')"
            @click="clearFilter"
            @keydown.enter.stop="clearFilter"
          >
            <i
              class="icon icon-close"
            />
          </RcButton>
        </div>
        <div
          v-if="namespaceFilterMode"
          class="ns-singleton-info"
        >
          <i
            v-clean-tooltip="t('resourceList.nsFilterToolTip')"
            class="icon icon-info"
          />
        </div>
        <RcButton
          v-else
          size="small"
          variant="ghost"
          class="ns-clear"
          :aria-label="t('namespaceFilter.button.clear')"
          @click="clear"
          @keydown.enter.stop="clear"
          @keydown.tab.exact.prevent="down"
        >
          <i
            class="icon icon-close"
          />
        </RcButton>
      </div>
      <div class="ns-divider mt-0" />
      <div
        ref="options"
        class="ns-options"
        role="listbox"
        tabindex="0"
        aria-live="polite"
        @keydown.down.enter.stop="down"
        @keydown.escape="close"
        @keydown.tab.exact.stop="close"
      >
        <template
          v-for="(opt, i) in cachedFiltered"
          :key="opt.id"
        >
          <hr
            v-if="opt.kind === NAMESPACE_FILTER_KINDS.DIVIDER"
            role="separator"
            aria-orientation="horizontal"
            class="ns-divider"
          >
          <div
            v-else
            :id="opt.elementId"
            tabindex="-1"
            role="option"
            class="ns-option"
            :aria-selected="opt.selected"
            :disabled="opt.enabled ? null : true"
            :class="{
              'ns-selected': opt.selected,
              'ns-single-match': cachedFiltered.length === 1 && !opt.selected,
            }"
            :data-testid="`namespaces-option-${i}`"
            @click="opt.enabled && selectOption(opt)"
            @mouseover="opt.enabled && mouseOver($event)"
            @keydown="itemKeyHandler($event, opt)"
          >
            <div
              class="ns-item"
            >
              <i
                v-if="opt.kind === NAMESPACE_FILTER_KINDS.NAMESPACE"
                class="icon icon-folder"
              />
              <div>{{ opt.label }}</div>
              <i
                v-if="opt.selected"
                class="icon icon-checkmark"
              />
            </div>
          </div>
        </template>
        <div
          v-if="cachedFiltered.length === 0"
          class="ns-none"
          data-testid="namespaces-option-none"
        >
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
    border-radius: var(--border-radius);

    &:focus, &.focused {
      @include focus-outline;
    }

    .ns-glass {
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      opacity: 0;
      position: fixed;

      z-index: z-index('overContent');
    }

    .ns-controls {
      align-items: center;
      display: flex;
    }

    .ns-clear {
      padding: 0 5px;
      &:hover {
        color: var(--primary);
      }
    }

    .ns-singleton-info, .ns-clear {
      align-items: center;
      display: flex;
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
      top: 10px;
      line-height: 24px;
      text-align: center;
      width: 14px;
      min-height: 14px;
    }

    .ns-chip-button {
      min-height: 14px;
    }

    .ns-dropdown-menu {
      background-color: var(--header-bg);
      border: 1px solid var(--primary-border);
      border-bottom-left-radius: var(--border-radius);
      border-bottom-right-radius: var(--border-radius);
      color: var(--header-btn-text);
      margin-top: -1px;
      padding-bottom: 10px;
      position: relative;
      z-index: z-index('dropdownOverlay');

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

      .ns-option {

        &[disabled] {
          cursor: default;
        }

        &:not([disabled]) {
          &:focus {
            background-color: var(--dropdown-hover-bg);
            color: var(--dropdown-hover-text);
          }
          .ns-item {
             &:hover, &:focus {
              background-color: var(--dropdown-hover-bg);
              color: var(--dropdown-hover-text);
              cursor: pointer;

              > i {
                color: var(--dropdown-hover-text);
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

          &.ns-selected:not(:hover) {
            .ns-item {
              > * {
                color: var(--link);
              }
            }

            &:focus {
              .ns-item {
                > * {
                  color: var(--dropdown-hover-text);
                }
              }
            }
          }
        }

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

        }

        &.ns-single-match {
          .ns-item {
            background-color: var(--dropdown-hover-bg);
            > * {
              color: var(--dropdown-hover-text);
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
      z-index: z-index('dropdownOverlay');

      &.ns-open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-color: var(--primary-border);
      }

      > .ns-values {
        flex: 1;
      }

      &:hover {
        > i {
          color: var(--primary);
        }
      }

      > i {
        height: $ns_dropdown_size;
        width: $ns_dropdown_size;
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
              color: var(--primary);
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
  .v-popper__popper {
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
