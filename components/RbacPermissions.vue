<script>
import { debounce } from 'lodash';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt, sameContents } from '@/utils/array';
import { clone } from '@/utils/object';

const READ_VERBS = ['get', 'list', 'watch'];
const WRITE_VERBS = ['create', 'delete', 'get', 'list', 'patch', 'update', 'watch'];

/**
 * A permissions component for RBAC roles
   @displayName Rbac Permissions
 */
export default {
  props: {
    /**
     * The rbac role in.
     * @model
     */
    value: {
      type:    Array,
      default: null,
    },
    /**
     * Page mode
     * @values create, view, edit, preview, clone, stage
     */
    mode: {
      type:    String,
      default: _EDIT,
    },
    /**
     * Section title
     */
    label: {
      type:    String,
      default: 'Permissions',
    },
    /**
     * Add button label
       @default - Displays Add + {lable}
     */
    btnLabel: {
      type:    String,
      default: null,
    },
    /**
     * Adds pad-left th to row
     */
    padLeft: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    const rows = (this.value || []).slice();

    for ( const row of rows ) {
      if ( !row.verbs || !row.verbs.length ) {
        continue;
      }

      // Compare to read/write standards
      if ( sameContents(row.verbs, READ_VERBS) ) {
        row.verbs = ['read'];
      } else if ( sameContents(row.verbs, WRITE_VERBS) ) {
        row.verbs = ['write'];
      }
    }

    return { rows };
  },

  computed: {
    /**
     * Gets called to check if page mode is view
     */
    isView() {
      return this.mode === _VIEW;
    },

    /**
     * Gets called to check if we show add button
     */
    showAdd() {
      return !this.isView;
    },

    /**
     * Gets called to check if we show remove button
     */
    showRemove() {
      return !this.isView;
    },

    /**
     * Returns standard verbs for verbs dropdown
     */
    standardVerbs() {
      return ['read', 'write', ...WRITE_VERBS];
    }
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    add() {
      /**
       * Gets called when the user clicks on the add button
       *
       * @param {Role} string `json:"role,omitempty"`
       * @param {Verbs} []string `json:"verbs,omitempty"`
       * @param {APIGroups} []string `json:"apigroups,omitempty"`
       * @param {Resources} []string   `json:"resources,omitempty"`
       * @param {ResourecNames} []string   `json:"resourcenames,omitempty"`
       * @param {NonResourceURLs} []string `json:"nonresourceurls,omitempty"`
       */
      this.rows.push({
        apiGroups:       [],
        nonResourceURLs: [],
        resourceNames:   [],
        resources:       [],
        verbs:           [],
      });
    },

    remove(idx) {
      /**
       * Gets called when the user clicks on the remove button
       */
      removeAt(this.rows, idx);
    },

    update() {
      /**
       * Gets called when the user makes input in to any of the row inputs
       * Clones each row and resets the array on output
       * @event input
       */
      if ( this.isView ) {
        return;
      }

      const out = [];

      for ( const row of this.rows ) {
        const value = clone(row);

        out.push(value);
      }

      this.$emit('input', out);
    }
  },
};
</script>

<template>
  <div>
    <div class="title clearfix">
      <h4>{{ label }}</h4>
    </div>

    <table v-if="rows.length" class="fixed">
      <thead>
        <tr>
          <th v-if="padLeft" class="left"></th>
          <th class="verbs">
            Verbs
          </th>
          <th class="apigroup">
            API Groups
          </th>
          <th class="resources">
            Resources
          </th>
          <th class="resourcesnames">
            Resource Names
          </th>
          <th class="nonresourceurls">
            Non-Resource URLs
          </th>
          <th v-if="showRemove" class="remove"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
        >
          <td v-if="padLeft" class="left"></td>
          <td class="verbs">
            <span v-if="isView">{{ row.verbs.join(',') }}</span>
            <v-select
              v-else
              ref="verbs"
              v-model="row.verbs"
              multiple
              :options="standardVerbs"
              :select-on-tab="true"
              taggable
              @input="queueUpdate"
            />
          </td>
          <td class="apigroup">
            <span v-if="isView">{{ row.apiGroups.join(',') }}</span>
            <v-select
              v-else
              ref="apiGroups"
              v-model="row.apiGroups"
              multiple
              :options="[]"
              :select-on-tab="true"
              taggable
              @input="queueUpdate"
            />
          </td>
          <td class="resources">
            <span v-if="isView">{{ row.resources.join(',') }}</span>
            <v-select
              v-else
              ref="resources"
              v-model="row.resources"
              multiple
              :no-drop="true"
              :options="[]"
              :select-on-tab="true"
              taggable
              @input="queueUpdate"
            />
          </td>
          <td class="resourcenames">
            <span v-if="isView">{{ row.resourceNames.join(',') }}</span>
            <v-select
              v-else
              ref="resourceNames"
              v-model="row.resourceNames"
              multiple
              :no-drop="true"
              :options="[]"
              :select-on-tab="true"
              taggable
              @input="queueUpdate"
            />
          </td>
          <td class="nonresourceurls">
            <span v-if="isView">{{ row.nonResourceURLs.join(',') }}</span>
            <v-select
              v-else
              ref="nonResourceURLs"
              v-model="row.nonResourceURLs"
              multiple
              :no-drop="true"
              :options="[]"
              :select-on-tab="true"
              taggable
              @input="queueUpdate"
            />
          </td>
          <td v-if="showRemove" class="remove">
            <button type="button" class="btn bg-transparent role-link" @click="remove(idx)">
              Remove
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else-if="isView" class="text-muted">
      &mdash;
    </div>
    <div v-if="showAdd" class="footer">
      <button type="button" class="btn bg-primary btn-sm add" @click="add()">
        <i class="icon icon-plus" />
        <span v-if="btnLabel">
          {{ btnLabel }}
        </span>
        <span v-else>
          Add {{ label }}
        </span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $remove: 75;
  $checkbox: 100;

  .title {
    margin-bottom: 10px;

    .read-from-file {
      float: right;
    }
  }

  TABLE {
    width: 100%;
  }

  TH {
    text-align: left;
    font-size: 12px;
    font-weight: normal;
    color: var(--input-label);
  }

  .left {
    width: #{$remove}px;
  }

  .remove {
    vertical-align: middle;
    text-align: right;
    width: #{$remove}px;
  }

  .footer {
    margin-top: 10px;

    .protip {
      float: right;
      padding: 5px 0;
    }
  }
</style>
