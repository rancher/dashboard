<script>
import Vue from 'vue';
import ProgressBarMulti from '@/components/ProgressBarMulti';
import PlusMinus from '@/components/form/PlusMinus';
import { SCALABLE_WORKLOAD_TYPES } from '~/config/types';
import { ucFirst } from '~/utils/string';

const SCALABLE_TYPES = Object.values(SCALABLE_WORKLOAD_TYPES);

export default {
  components: { PlusMinus, ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    },
    rowKey: {
      type:     String,
      required: true
    },
  },

  mounted() {
    document.addEventListener('click', this.onClickOutside);
  },

  beforeDestroy() {
    document.removeEventListener('click', this.onClickOutside);
  },

  data() {
    return { disabled: false, expanded: false };
  },

  computed: {
    id() {
      return `${ this.rowKey }-workload-health-scale`.replaceAll('-', '');
    },

    canScale() {
      return !!SCALABLE_TYPES.includes(this.row.type) && this.row.canUpdate;
    },

    parts() {
      return Object.entries(this.row.jobGauges || this.row.podGauges || [])
        .map(([name, value]) => ({
          color: `bg-${ value.color }`,
          value: value.count || 0,
          label: ucFirst(name)
        })).filter(x => x.value > 0);
    },
  },

  methods:  {
    onClickOutside(event) {
      const { [`root-${ this.id }`]: component } = this.$refs;

      if (!component || component.contains(event.target)) {
        return;
      }
      this.expanded = false;
    },

    async scaleDown() {
      await this.scale(false);
    },
    async scaleUp() {
      await this.scale(true);
    },
    async scale(isUp) {
      Vue.set(this, 'disabled', true);
      try {
        if (isUp) {
          await this.row.scaleUp();
        } else {
          await this.row.scaleDown();
        }
      } catch (err) {
        this.$store.dispatch('growl/fromError', {
          title: this.t('workload.list.errorCannotScale', { direction: isUp ? 'up' : 'down', workloadName: this.row.name }),
          err
        },
        { root: true });
      }
      Vue.set(this, 'disabled', false);
    },

    insideBounds(bounding, bounds) {
      return bounding.top >= bounds.top &&
        bounding.left >= bounds.left &&
        bounding.right <= bounds.right &&
        bounding.bottom <= bounds.bottom;
    },

  },

  watch: {
    expanded(neu) {
      setTimeout(() => { // There be beasts without this (classes don't get applied... so drop down never gets shown)
        const dropdown = document.getElementById(this.id);

        if (!neu) {
          dropdown.classList.remove('viewported');

          return;
        }

        // Ensire drop down will be inside of the window, otherwise show above the trigger
        const bounding = dropdown.getBoundingClientRect();
        const insideWindow = this.insideBounds(bounding, {
          top:    0,
          left:   0,
          right:  window.innerWidth || document.documentElement.clientWidth,
          bottom:  window.innerHeight || document.documentElement.clientHeight,
        });

        // Ensure drop down will be inside the table, otherwise the table will overflow:hidden it
        const table = document.getElementsByClassName('sortable-table')[0];
        const insideTable = this.insideBounds(bounding, table.getBoundingClientRect());

        if (insideWindow && insideTable) {
          dropdown.classList.remove('out-of-view-port');
        } else {
          dropdown.classList.add('out-of-view-port');
        }

        // This will trigger the actual display of the drop down (after we've calculated if it goes below or above trigger)
        dropdown.classList.add('viewported');
      });
    }
  }
};
</script>

<template>
  <div :id="`root-${id}`" :ref="`root-${id}`" class="hs-popover">
    <div id="trigger" class="hs-popover__trigger" :class="{expanded}" @click="expanded = !expanded">
      <ProgressBarMulti v-if="parts" class="health" :values="parts" :show-zeros="true" />
      <i :class="{icon: true, 'icon-chevron-up': expanded, 'icon-chevron-down': !expanded}" />
    </div>
    <div :id="id" class="hs-popover__content" :class="{expanded, [id]:true}">
      <div>
        <div v-for="obj in parts" :key="obj.label" class="counts">
          <span>{{ obj.label }}</span>
          <span>{{ obj.value }}</span>
        </div>
        <div v-if="canScale" class="text-center scale">
          <span>{{ t('tableHeaders.scale') }} </span>
          <PlusMinus :value="row.spec.replicas" :disabled="disabled" @minus="scaleDown" @plus="scaleUp" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">

$height: 30px;
$width: 150px;

.hs-popover {
  position: relative;

  &__trigger {
    display: flex;
    align-items: center;

    width: $width;
    height: $height;

    border: solid thin var(--sortable-table-top-divider);

    &.expanded {
      background-color: var(--sortable-table-row-bg);
    }
    &:not(.expanded):hover {
      background-color: var(--accent-btn);
      .icon {
        color: unset;
      }
    }

    .health {
      width: $width - $height; // height is width of icon;
      margin-left: 5px;
    }
    .icon {
      font-size: $height;
      width: $height;
      color: var(--primary);
      margin-top: 1px;
    }
  }

  &__content {
    z-index: 20;
    width: $width;

    border: solid thin var(--sortable-table-top-divider);
    background-color: var(--sortable-table-row-bg);

    position: absolute;
    margin-top: -1px;

    visibility: hidden;
    &.viewported {
      visibility: visible;
    }

    &.out-of-view-port {
      // Flip to show drop down above trigger
      bottom: 0;
      margin-bottom: $height;
    }

    & > div {
      padding: 10px;
    }

    .counts {
      display: flex;
      justify-content: space-between;
    }
    .scale {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
  }
}

</style>
