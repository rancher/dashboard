<script>
import { NAMESPACE_FILTERS } from '@/store/prefs';
import { NAMESPACE, EXTERNAL } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { isArray, addObjects, findBy } from '@/utils/array';
import { BOTH, CLUSTER_LEVEL } from '@/store/type-map';

export default {
  computed: {
    value: {
      get() {
        const values = this.$store.getters['prefs/get'](NAMESPACE_FILTERS);
        const options = this.options;

        if ( !values ) {
          return [];
        }

        const out = values.map((value) => {
          return findBy(options, 'id', value);
        }).filter(x => !!x);

        return out;
      },

      set(neu) {
        this.$store.dispatch('switchNamespaces', neu.map(x => x.id).filter(x => !!x));
      }
    },

    options() {
      const t = this.$store.getters['i18n/t'];

      const out = [
        {
          id:       'all',
          kind:     'special',
          label:    t('nav.ns.all'),
          disabled: this.$store.getters['isAllNamespaces'] || this.$store.getters['namespaceMode'] === CLUSTER_LEVEL,
        },
        {
          id:       'all://system',
          kind:     'special',
          label:    t('nav.ns.system'),
          disabled: this.$store.getters['isAllNamespaces'] || this.$store.getters['namespaceMode'] === CLUSTER_LEVEL,
        },
      ];

      divider();

      out.push({
        id:       'namespaced://true',
        kind:     'special',
        label:    t('nav.ns.namespaced'),
        disabled: this.$store.getters['namespaceMode'] !== BOTH,
      });

      out.push({
        id:       'namespaced://false',
        kind:     'special',
        label:    t('nav.ns.clusterLevel'),
        disabled: this.$store.getters['namespaceMode'] !== BOTH,
      });

      divider();

      const namespaces = sortBy(this.$store.getters['cluster/all'](NAMESPACE), ['nameDisplay']);

      if ( this.$store.getters['isMultiCluster'] ) {
        const projects = sortBy(this.$store.getters['clusterExternal/all'](EXTERNAL.PROJECT), ['nameDisplay']);
        const projectsById = {};
        const namespacesByProject = {};
        let firstProject = true;

        namespacesByProject[null] = []; // For namespaces not in a project

        for ( const project of projects ) {
          projectsById[project.id] = project;
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
          const id = project.id;

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
    }
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
    margin: 2px;
    user-select: none;
    cursor: default;
  }

  .filter ::v-deep INPUT {
    width: auto;
    background-color: transparent;
  }

  .filter ::v-deep INPUT:hover {
    background-color: transparent;
  }
</style>

<template>
  <div class="filter">
    <v-select
      ref="select"
      v-model="value"
      multiple
      :placeholder="t('nav.ns.user')"
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
