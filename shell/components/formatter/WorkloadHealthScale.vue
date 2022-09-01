<script>
import Vue from 'vue';
import ProgressBarMulti from '@shell/components/ProgressBarMulti';
import PlusMinus from '@shell/components/form/PlusMinus';
import { SCALABLE_WORKLOAD_TYPES } from '@shell/config/types';
import { ucFirst } from '@shell/utils/string';

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

  beforeDestroy() {
    document.removeEventListener('click', this.onClickOutside);
  },

  data() {
    return {
      disabled: false,
      expanded: false,
      loading:  true,
      cParts:   [],
    };
  },

  computed: {
    id() {
      return `${ this.rowKey }-workload-health-scale`.replaceAll('-', '');
    },

    canScale() {
      return !!SCALABLE_TYPES.includes(this.row.type) && this.row.canUpdate;
    },

    parts() {
      return this.cParts;
    },
  },

  methods:  {
    liveUpdate() {
      if (this.loading) {
        return 5;
      }

      this.cParts = Object.entries(this.row.jobGauges || this.row.podGauges || [])
        .map(([name, value]) => ({
          color: `bg-${ value.color }`,
          value: value.count || 0,
          label: ucFirst(name)
        })).filter(x => x.value > 0);

      return 5;
    },
    startDelayedLoading() {
      this.loading = false;
      this.liveUpdate();
    },

    onClickOutside(event) {
      const { [`root-${ this.id }`]: component } = this.$refs;

      if (!component || component.contains(event.target)) {
        return;
      }
      this.expanded = false;
      event.preventDefault();
      event.stopPropagation();
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
      if (neu) {
        document.addEventListener('click', this.onClickOutside);
      } else {
        document.removeEventListener('click', this.onClickOutside);
      }

      // If the drop down content appears outside of the window then move it to be above the trigger
      // Do this is three steps
      // expanded: false & expanded-checked = false - Content does not appear in DOM
      // expanded: true & expanded-checked = false - Content appears in DOM (so it's location can be calculated to be in or out of an area) but isn't visible (user doesn't see content blip from below to above trigger)
      // expanded: true & expanded-checked = true - Content appears in DOM and is visible (it's final location is known so user can see)
      setTimeout(() => { // There be beasts without this (classes don't get applied... so drop down never gets shown)
        const dropdown = document.getElementById(this.id);

        if (!neu) {
          dropdown.classList.remove('expanded-checked');

          return;
        }

        // Ensure drop down will be inside of the window, otherwise show above the trigger
        const bounding = dropdown.getBoundingClientRect();
        const insideWindow = this.insideBounds(bounding, {
          top:    0,
          left:   0,
          right:  window.innerWidth || document.documentElement.clientWidth,
          bottom:  window.innerHeight || document.documentElement.clientHeight,
        });

        if (insideWindow) {
          dropdown.classList.remove('out-of-view');
        } else {
          dropdown.classList.add('out-of-view');
        }

        // This will trigger the actual display of the drop down (after we've calculated if it goes below or above trigger)
        dropdown.classList.add('expanded-checked');
      });
    }
  }
};
</script>

<template>
  <div v-if="loading" class="hs-popover__loader">
    <i class="icon icon-spinner" />
  </div>
  <div v-else :id="`root-${id}`" :ref="`root-${id}`" class="hs-popover">
    <div id="trigger" class="hs-popover__trigger" :class="{expanded}" @click="expanded = !expanded">
      <ProgressBarMulti v-if="parts" class="health" :values="parts" :show-zeros="true" />
      <i :class="{icon: true, 'icon-chevron-up': expanded, 'icon-chevron-down': !expanded}" />
    </div>
    <div :id="id" class="hs-popover__content" :class="{expanded, [id]:true}">
      <div>
        <div v-for="obj in parts" :key="obj.label" class="counts">
          <span class="counts-label">{{ obj.label }}</span>
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

<style lang="scss" scoped>

$height: 30px;
$width: 150px;

.hs-popover {
  position: relative;

  &__loader {
    align-items: center;
    border: solid thin var(--sortable-table-top-divider);
    display: flex;
    height: $height;
    width: $width;

    > i {
      font-size: 16px;
      height: 16px;
      margin-left: 5px;
      width: 16px;
    }
  }

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
    z-index: 14;
    width: $width;

    border: solid thin var(--sortable-table-top-divider);
    background-color: var(--sortable-table-row-bg);

    position: absolute;
    margin-top: -1px;

    display: none;
    visibility: hidden;
    &.expanded {
      display: inline;
    }
    &.expanded-checked {
      visibility: visible;
    }

    &.out-of-view {
      // Flip to show drop down above trigger
      bottom: 0;
      margin-bottom: $height - 1px;
    }

    & > div {
      padding: 10px;
    }

    .counts {
      display: flex;
      justify-content: space-between;

      &-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
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
