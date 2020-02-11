<script>
import SortableTable from '@/components/SortableTable';
import { RBAC_HEADERS, RESOURCE, API_GROUP } from '@/config/table-headers';

/**
 * Table list of RBAC role permissions and rules
   @displayName Table RBAC Rules
 */
export default {
  name: 'TableRbacRules',

  components: { SortableTable },

  props: {
    /**
     * The RBAC role containing the permissions rules
     * @model
     */
    role: {
      type:     Object,
      required: true,
      default:  () => ({})
    }
  },

  computed: {
    /**
     * Returns mutated rows with human readable values for resources, apiGroups and nonResourceURLs
     */
    filteredRows() {
      const { rules } = this.role;

      return rules.map((rule) => {
        const parsedVerbs = parseVerbs(rule.verbs || []);

        return {
          ...parsedVerbs,
          resource:  normalizeResourceTargets(rule.resources),
          apiGroups: normalizeResourceTargets(rule.apiGroups, true)
        };
      });

      function parseVerbs(verbs) {
        const allVerbs = {
          create:    false,
          delete:    false,
          get:       false,
          list:      false,
          patch:     false,
          update:    false,
          watch:     false,
        };

        verbs.forEach((verb) => {
          if (Object.prototype.hasOwnProperty.call(allVerbs, verb)) {
            allVerbs[verb] = true;
          }
        });

        return allVerbs;
      }

      function normalizeResourceTargets(resourceNames = [], isGroups = false) {
        let normalized = '';
        const allTargets = isGroups ? 'All API Groups' : 'All Resources';

        if (resourceNames.length === 1) {
          if (resourceNames[0] === '' || resourceNames[0] === '*') {
            return allTargets;
          }

          return resourceNames[0];
        }

        resourceNames.forEach((rsrc, idx, ogArr) => {
          if (rsrc === '' || rsrc === '*') {
            rsrc = allTargets;
          }

          if (normalized.length === 0) {
            normalized = `${ rsrc }`;
          } else {
            normalized = `${ normalized }, ${ rsrc }`;
          }
        });

        return normalized;
      }
    },

    /**
     * Returns table headers
     */
    headers() {
      return [...RBAC_HEADERS, RESOURCE, API_GROUP];
    },
  },
};

</script>

<template>
  <div>
    <div class="sortable-table-header">
      <h4>
        Grant Resources
      </h4>
    </div>
    <div class="spacer"></div>
    <SortableTable
      v-bind="$attrs"
      :headers="headers"
      :rows="filteredRows"
      :search="false"
      :table-actions="false"
      :row-actions="false"
      :top-divider="false"
      :body-dividers="true"
      key-field="_key"
      v-on="$listeners"
    />
  </div>
</template>
