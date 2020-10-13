<script>
import { NAMESPACE_FILTERS } from '@/store/prefs';
import { NAMESPACE, MANAGEMENT } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { isArray, addObjects, findBy, filterBy } from '@/utils/array';

export default {
  computed: {
    value: {
      get() {
        const values = this.$store.getters['prefs/get'](NAMESPACE_FILTERS);
        const options = this.options;

        if ( !values ) {
          return [];
        }

        // Remove values that are not valid options
        const out = values.map((value) => {
          return findBy(options, 'id', value);
        }).filter(x => !!x);

        return out;
      },

      set(neu) {
        const old = (this.value || []).slice();

        neu = neu.filter(x => !!x.id);

        const last = neu[neu.length - 1];
        const lastIsSpecial = last?.kind === 'special';
        const hadUser = old.find(x => x.id === 'all://user');
        const hadAll = old.find(x => x.id === 'all');

        if ( lastIsSpecial ) {
          neu = [last];
        }

        if ( neu.length > 1 ) {
          neu = neu.filter(x => x.kind !== 'special');
        }

        if ( neu.find(x => x.id === 'all') ) {
          neu = [];
        }

        let ids;

        // If there as something selected and you remove it, go back to user by default
        // Unless it was user or all
        if (neu.length === 0 && !hadUser && !hadAll ) {
          ids = ['all://user'];
        } else {
          ids = neu.map(x => x.id);
        }

        this.$store.dispatch('switchNamespaces', ids);
      }
    },

    options() {
      const t = this.$store.getters['i18n/t'];

      const out = [
        {
          id:       'all',
          kind:     'special',
          label:    t('nav.ns.all'),
        },
        {
          id:       'all://user',
          kind:     'special',
          label:    t('nav.ns.user'),
        },
        {
          id:       'all://system',
          kind:     'special',
          label:    t('nav.ns.system'),
        },
        {
          id:       'namespaced://true',
          kind:     'special',
          label:    t('nav.ns.namespaced'),
        },
        {
          id:       'namespaced://false',
          kind:     'special',
          label:    t('nav.ns.clusterLevel'),
        }
      ];

      divider();

      const inStore = this.$store.getters['currentProduct'].inStore;
      const namespaces = sortBy(this.$store.getters[`${ inStore }/all`](NAMESPACE), ['nameDisplay']);

      if ( this.$store.getters['isMultiCluster'] ) {
        const cluster = this.$store.getters['currentCluster'];
        let projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

        projects = sortBy(filterBy(projects, 'spec.clusterName', cluster.id), ['nameDisplay']);
        const projectsById = {};
        const namespacesByProject = {};
        let firstProject = true;

        namespacesByProject[null] = []; // For namespaces not in a project

        for ( const project of projects ) {
          projectsById[project.metadata.name] = project;
        }

        for (const namespace of namespaces ) {
          let projectId = namespace.projectId;

          if ( !projectId || !projectsById[projectId] ) {
            // If there's a projectId but that project doesn't exist, treat it like no project
            projectId = null;
          }

          let entry = namespacesByProject[namespace.projectId];

          if ( !entry ) {
            entry = [];
            namespacesByProject[namespace.projectId] = entry;
          }

          entry.push(namespace);
        }

        for ( const project of projects ) {
          const id = project.metadata.name;

          if ( firstProject ) {
            firstProject = false;
          } else {
            divider();
          }

          out.push({
            id:    `project://${ id }`,
            kind:  'project',
            label:  t('nav.ns.project', { name: project.nameDisplay }),
          });

          const forThisProject = namespacesByProject[id] || [];

          addNamespace(forThisProject);
        }

        const orphans = namespacesByProject[null];

        if ( orphans.length ) {
          if ( !firstProject ) {
            divider();
          }

          out.push({
            id:       'all://orphans',
            kind:     'project',
            label:    t('nav.ns.orphan'),
            disabled: true,
          });

          addNamespace(orphans);
        }
      } else {
        addNamespace(namespaces);
      }

      return out;

      function addNamespace(namespaces) {
        if ( !isArray(namespaces) ) {
          namespaces = [namespaces];
        }

        addObjects(out, namespaces.map((namespace) => {
          return {
            id:    `ns://${ namespace.id }`,
            kind:  'namespace',
            label:  t('nav.ns.namespace', { name: namespace.nameDisplay }),
          };
        }));
      }

      function divider() {
        out.push({
          kind:     'divider',
          label:    `Divider ${ out.length }`,
          disabled: true,
        });
      }
    }
  },

  methods: {
    focus() {
      this.$refs.select.$refs.search.focus();
    },
  },
};

</script>

<style type="scss" scoped>
  .filter ::v-deep .v-select {
    min-width: 220px;
    max-width: 100%;
    display: inline-block;
  }

  .filter ::v-deep .v-select .vs__selected {
    margin: 4px;
    user-select: none;
    cursor: default;
    background: rgba(255, 255, 255, 0.25);
    border: solid white thin;
    color: white;
    height: calc(var(--header-height) - 26px);
  }

  .filter ::v-deep INPUT {
    width: auto;
    background-color: transparent;
  }

  .filter ::v-deep .vs__search::placeholder {
    color: white;
  }

  .filter ::v-deep INPUT:hover {
    background-color: transparent;
  }

  .filter ::v-deep .vs__dropdown-toggle {
    max-width: 100%;
    border: 1px solid var(--header-btn-bg);
    color: var(--header-btn-text);
    background: rgba(0, 0, 0, 0.05);
    border-radius: var(--border-radius);
    height: calc(var(--header-height) - 16px);
  }

  .filter ::v-deep .vs__deselect:after {
    color: white;
  }

  .filter ::v-deep .v-select .vs__actions:after {
    fill: white !important;
    color: white !important;
}

  .filter ::v-deep INPUT[type='search'] {
    padding: 7px;
  }
</style>

<template>
  <div class="filter">
    <v-select
      ref="select"
      v-model="value"
      multiple
      :placeholder="t('nav.ns.all')"
      :selectable="option => !option.disabled && option.id"
      :options="options"
      label="label"
    >
      <template v-slot:option="opt">
        <template v-if="opt.kind === 'namespace'">
          <i class="mr-5 icon icon-fw icon-folder" /> {{ opt.label }}
        </template>
        <template v-else-if="opt.kind === 'project'">
          <b>{{ opt.label }}</b>
        </template>
        <template v-else-if="opt.kind === 'divider'">
          <hr />
        </template>
        <template v-else>
          {{ opt.label }}
        </template>
      </template>
    </v-select>
    <button v-shortkey.once="['n']" class="hide" @shortkey="focus()" />
  </div>
</template>
