<script>
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: { Checkbox },
  props:      {
    row: {
      type:     Object,
      required: true,
    },
    rowActions: {
      type:     Boolean,
      required: true,
    },
    tableActions: {
      // Show bulk table actions
      type:    Boolean,
      default: true,
    },
    selectedRows: {
      type:     Array,
      required: true,
    },
    actionOfInterest: {
      type:     String,
      required: true,
    },
    subExpandColumn: {
      type:     Boolean,
      required: true,
    },
    expanded: {
      type:     Object,
      required: true,
    },
    getCustomDetailLink: {
      type:    Function,
      default: null,
    },
    i: {
      // row index
      type:     Number,
      required: true,
    },
    dt: {
      type:     Object,
      required: true,
    },
    keyField: {
      type:     String,
      required: true,
    },
  },
  data() {
    return {};
  },
  methods: {
    handleActionButtonClick(i, event) {
    // Each row in the table gets its own ref with
    // a number based on its index. If you are using
    // an ActionMenu that doen't have a dependency on Vuex,
    // these refs are useful because you can reuse the
    // same ActionMenu component on a page with many different
    // target elements in a list,
    // so you can still avoid the performance problems that
    // could result if the ActionMenu was in every row. The menu
    // will open on whichever target element is clicked.
      this.$emit('clickedActionButton', {
        event,
        targetElement: this.$refs[`actionButton${ i }`][0],
      });
    }
  }
};
</script>

<template>
  <!-- The data-cant-run-bulk-action-of-interest attribute is being used instead of :class because
              because our selection.js invokes toggleClass and :class clobbers what was added by toggleClass if
              the value of :class changes. -->
  <tr
    :key="row.key"
    class="main-row"
    :class="{ 'has-sub-row': row.showSubRow }"
    :data-node-id="row.key"
    :data-cant-run-bulk-action-of-interest="
      actionOfInterest && !row.canRunBulkActionOfInterest
    "
  >
    <td v-if="tableActions" class="row-check" align="middle">
      {{ row.mainRowKey
      }}<Checkbox
        class="selection-checkbox"
        :data-node-id="row.key"
        :value="selectedRows.includes(row.row)"
      />
    </td>
    <td v-if="subExpandColumn" class="row-expand" align="middle">
      <i
        data-title="Toggle Expand"
        :class="{
          icon: true,
          'icon-chevron-right': !expanded[row.row[keyField]],
          'icon-chevron-down': !!expanded[row.row[keyField]],
        }"
        @click.stop="toggleExpand(row.row)"
      />
    </td>
    <template v-for="(col, j) in row.columns">
      <slot
        :name="'col:' + col.col.name"
        :row="row.row"
        :col="col.col"
        :dt="dt"
        :expanded="expanded"
        :rowKey="row.key"
      >
        <td
          :key="col.col.name"
          :data-title="col.col.label"
          :data-testid="`sortable-cell-${i}-${j}`"
          :align="col.col.align || 'left'"
          :class="{
            ['col-' + col.dasherize]: !!col.col.formatter,
            [col.col.breakpoint]: !!col.col.breakpoint,
            ['skip-select']: col.col.skipSelect,
          }"
          :width="col.col.width"
        >
          <slot
            :name="'cell:' + col.col.name"
            :row="row.row"
            :col="col.col"
            :value="col.value"
          >
            <component
              :is="col.component"
              v-if="col.component && col.needRef"
              ref="column"
              :value="col.value"
              :row="row.row"
              :col="col.col"
              v-bind="col.col.formatterOpts"
              :row-key="row.key"
              :get-custom-detail-link="getCustomDetailLink"
            >
            </component>
            <component
              :is="col.component"
              v-else-if="col.component"
              :value="col.value"
              :row="row.row"
              :col="col.col"
              v-bind="col.col.formatterOpts"
              :row-key="row.key"
            >
            </component>
            <component
              :is="col.col.formatter"
              v-else-if="col.col.formatter"
              :value="col.value"
              :row="row.row"
              :col="col.col"
              v-bind="col.col.formatterOpts"
              :row-key="row.key"
            >
            </component>
            <template v-else-if="col.value !== ''">
              {{ col.formatted }}
            </template>
            <template v-else-if="col.col.dashIfEmpty">
              <span class="text-muted">&mdash;</span>
            </template>
          </slot>
        </td>
      </slot>
    </template>
    <td v-if="rowActions" align="middle">
      <slot name="row-actions" :row="row.row">
        <button
          :id="`actionButton+${i}+${
            row.row && row.row.name ? row.row.name : ''
          }`"
          :ref="`actionButton${i}`"
          aria-haspopup="true"
          aria-expanded="false"
          type="button"
          class="btn btn-sm role-multi-action actions"
          @click="handleActionButtonClick(i, $event)"
        >
          <i class="icon icon-actions" />
        </button>
      </slot>
    </td>
  </tr>
</template>
