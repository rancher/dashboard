<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt, sameContents } from '@/utils/array';
import { clone } from '@/utils/object';
import Select from '@/components/form/Select';

const READ_VERBS = ['get', 'list', 'watch'];
const WRITE_VERBS = ['create', 'delete', 'get', 'list', 'patch', 'update', 'watch'];

export default {
  components: { Select },
  props:      {
    value: {
      type:    Array,
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    label: {
      type:    String,
      default: 'Permissions',
    },
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
    isView() {
      return this.mode === _VIEW;
    },

    showAdd() {
      return !this.isView;
    },

    showRemove() {
      return !this.isView;
    },

    standardVerbs() {
      return ['read', 'write', ...WRITE_VERBS];
    }
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  /*
    Role         string   `json:"role,omitempty"`
    Verbs        []string `json:"verbs,omitempty"`
    APIGroup     string   `json:"apiGroup,omitempty"`
    Resource     string   `json:"resource,omitempty"`
    URL          string   `json:"url,omitempty"`
    ResourceName string   `json:"resourceName,omitempty"`
  */

  methods: {
    add() {
      this.rows.push({
        verbs:        [],
        apiGroup:     '',
        resource:     '',
        resourceName: '',
      });

      /*
      this.$nextTick(() => {
        const inputs = this.$refs.verbs;

        inputs[inputs.length - 1].focus();
      });
      */
    },

    remove(idx) {
      removeAt(this.rows, idx);
    },

    update() {
      if ( this.isView ) {
        return;
      }

      const out = [];

      for ( const row of this.rows ) {
        const value = clone(row);

        if ( value.verbs.length && value.resource ) {
          out.push(value);
        }
      }

      this.$emit('input', out);
    }
  },
};
</script>

<template>
  <div>
    <div class="clearfix">
      <h4>{{ label }}</h4>
    </div>

    <table v-if="rows.length" class="fixed zebra-table">
      <thead>
        <tr>
          <th v-if="padLeft" class="left"></th>
          <th class="verbs">
            Verbs
          </th>
          <th class="apigroup">
            API Group
          </th>
          <th class="resource">
            Resource
          </th>
          <th class="resourcename">
            Resource Name
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
          <td v-if="row.role" colspan="4">
            <b>Role:</b> {{ row.role }}
          </td>
          <td v-else-if="row.url" colspan="4">
            <b>URL:</b> {{ row.url }}
          </td>
          <template v-else>
            <td class="verbs">
              <span v-if="isView">{{ row.verbs.join(',') }}</span>
              <Select
                v-else
                ref="verbs"
                v-model="row.verbs"
                multiple
                :options="standardVerbs"
                taggable
                @input="queueUpdate"
              />
            </td>
            <td class="apigroup">
              <span v-if="isView">{{ row.apiGroup }}</span>
              <label v-else>
                <input
                  v-model="row.apiGroup"
                  type="text"
                  @input="queueUpdate"
                />
              </label>
            </td>
            <td class="resource">
              <span v-if="isView">{{ row.resource }}</span>
              <label v-else>
                <input
                  v-model="row.resource"
                  type="text"
                  @input="queueUpdate"
                />
              </label>
            </td>
            <td class="resourcename">
              <span v-if="isView">{{ row.resourceName }}</span>
              <label v-else>
                <input
                  v-model="row.resourceName"
                  type="text"
                  @input="queueUpdate"
                />
              </label>
            </td>
          </template>
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
        Add {{ label }}
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
