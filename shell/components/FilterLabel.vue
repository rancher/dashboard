<script>
import ArrayList from '@shell/components/form/ArrayList';
import Select from '@shell/components/form/Select';

export default {
  name: 'HarvesterFilterLabel',

  components: {
    Select,
    ArrayList
  },

  props:      {
    rows: {
      type:     Array,
      required: true,
    },
  },

  data() {
    return {
      searchLabels:    [],
      defaultAddValue: {
        key:   '',
        value: '',
      }
    };
  },

  computed: {
    optionLabels() {
      const labels = this.rows.map((row) => {
        return Object.keys(row.labels);
      });

      return Array.from(new Set(labels.flat()));
    },
  },

  methods: {
    calcValueOptions(key) {
      const valueOptions = [];

      this.rows.map((row) => {
        const isExistValue = valueOptions.find(value => value.label === row.labels[key]);

        if (Object.keys(row.labels).includes(key) && key && row.labels[key] && !isExistValue) {
          valueOptions.push({
            value: row.labels[key],
            label: row.labels[key]
          });
        }
      });

      return valueOptions;
    },

    removeAll() {
      this.$set(this, 'searchLabels', []);
    },

    remove(label) {
      this.searchLabels.find((L, index) => {
        if (L.key === label.key && L.value === label.value) {
          this.searchLabels.splice(index, 1);
          this.filterRows();

          return true;
        }
      });
    },

    filterRows() {
      const rows = this.rows.filter((row) => {
        const hasSearch = this.searchLabels.find(search => search.key);

        if (!hasSearch) {
          return this.rows;
        }

        const labels = row.labels;
        const keys = Object.keys(labels);

        return this.searchLabels.find((search) => {
          if (search.key && keys.includes(search.key)) {
            if (!search.value) { // If value is empty, all data containing the key is retained
              return true;
            } else if (search.value === labels[search.key]) {
              return true;
            } else if (search.value !== labels[search.key]) {
              return false;
            }
          } else {
            return false;
          }
        });
      });

      this.$emit('changeRows', rows, this.searchLabels);
    }
  },

  watch: {
    rows: {
      deep:      true,
      immediate: true,
      handler() {
        this.filterRows();
      }
    }
  }
};
</script>

<template>
  <div class="filter">
    <template v-for="(label, index) in searchLabels">
      <span v-if="label.key" :key="`${label.key}${index}`" class="banner-item bg-warning">
        {{ label.key }}{{ label.value ? "=" : '' }}{{ label.value }}<i class="icon icon-close" @click="remove(label)" />
      </span>
    </template>

    <v-popover
      trigger="click"
      placement="bottom-end"
    >
      <slot name="header">
        <button ref="actionDropDown" class="btn bg-primary mr-10">
          <slot name="title">
            {{ t('harvester.fields.filterLabels') }}
          </slot>
        </button>
      </slot>

      <template slot="popover">
        <div class="filter-popup">
          <div>
            <ArrayList
              v-model="searchLabels"
              :show-header="true"
              :default-add-value="defaultAddValue"
              :initial-empty-row="true"
              @input="filterRows"
            >
              <template v-slot:column-headers>
                <div class="box">
                  <div class="key">
                    {{ t('generic.key') }}
                    <span class="required">*</span>
                  </div>
                  <div class="value">
                    {{ t('generic.value') }}
                  </div>
                  <div />
                </div>
              </template>
              <template v-slot:columns="scope">
                <div class="key">
                  <Select
                    ref="select"
                    key="label"
                    v-model="scope.row.value.key"
                    :append-to-body="false"
                    :searchable="true"
                    :options="optionLabels"
                    @input="filterRows"
                  />
                </div>
                <div class="value">
                  <Select
                    v-if="calcValueOptions(scope.row.value.key).length > 0"
                    ref="select"
                    key="value"
                    v-model="scope.row.value.value"
                    :append-to-body="false"
                    :searchable="true"
                    :options="calcValueOptions(scope.row.value.key)"
                    @input="filterRows"
                  />
                  <input v-else v-model="scope.row.value.value" class="input-sm" type="search" @input="filterRows" />
                </div>
              </template>

              <template #add="{add}">
                <div>
                  <button
                    type="button"
                    class="btn role-tertiary add"
                    data-testid="add-item"
                    @click="add()"
                  >
                    {{ t('generic.add') }}
                  </button>

                  <button
                    type="button"
                    class="btn role-tertiary add"
                    data-testid="remove-all-item"
                    @click="removeAll()"
                  >
                    {{ t('generic.clearAll') }}
                  </button>
                </div>
              </template>
            </ArrayList>
          </div>
        </div>
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss" scoped>
.filter {
  display: inline-block;

  .banner-item {
    display: inline-block;
    font-size: 16px;
    margin-right: 10px;
    padding: 6px;
    border-radius: 2px;

    i {
      cursor: pointer;
      vertical-align: middle;
    }
  }
}
.filter-popup {
  width: 600px;
}

::v-deep .box {
  display: grid;
  grid-template-columns: 40% 40% 10%;
  column-gap: 1.75%;
  align-items: center;
  margin-bottom: 10px;

  .key,
  .value {
    height: 100%;

    INPUT {
      height: $unlabeled-input-height;
    }
  }
}

.required {
  color: var(--error);
}
</style>
