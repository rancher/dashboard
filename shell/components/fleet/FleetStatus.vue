<script>
import { sortBy } from '@shell/utils/sort';
import { get } from '@shell/utils/object';
import { stateSort } from '~shell/plugins/steve/resource-class';

export default {

  name: 'FleetStatus',

  props: {
    values: {
      type:     Array,
      required: true,
    },
    colorKey: {
      type:    String,
      default: 'color',
    },
    labelKey: {
      type:    String,
      default: 'label',
    },
    valueKey: {
      type:    String,
      default: 'value',
    },
    min: {
      type:    Number,
      default: 0
    },
    max: {
      type:    Number,
      default: null,
    },
    minPercent: {
      type:    Number,
      default: 5,
    },
    showZeros: {
      type:    Boolean,
      default: false,
    },

    title: {
      type:    String,
      default: 'Resources'
    }
  },

  computed: {
    meta() {
      return {
        total:      this.values.map(x => x.value).reduce((a, b) => a + b),
        readyCount: this.values.filter(x => x.label === 'Success' || x.label === 'Ready').map(x => x.value).reduce((a, b) => a + b)
      };
    },

    pieces() {
      let out = [...this.values].reduce((prev, obj) => {
        const color = get(obj, this.colorKey);
        const label = get(obj, this.labelKey);
        const value = get(obj, this.valueKey);

        if ( obj[this.valueKey] === 0 && !this.showZeros) {
          return prev;
        }

        prev.push({
          color,
          label,
          value,
          sort: stateSort(color),
        });

        return prev;
      }, []);

      const minPercent = this.minPercent || 0;
      const min = this.min || 0;
      let max = this.max;
      let sum = 0;

      if ( !this.max ) {
        max = 100;
        if ( out.length ) {
          max = out.map(x => x.value).reduce((a, b) => a + b);
        }
      }

      out = this.values.map((obj) => {
        if (obj.value === 0 ) {
          obj.percent = 0;

          return obj;
        }
        const percent = Math.max(minPercent, toPercent(obj.value, min, max));

        obj.percent = percent;
        sum += percent;

        return obj;
      });

      // If the sum is bigger than 100%, take it out of the biggest piece
      if ( sum > 100 ) {
        sortBy(out, 'percent', true)[0].percent -= sum - 100;
      }

      out = this.values.map((obj) => {
        obj.style = `width: ${ obj.percent }%; background: var(--${ obj.color })`;

        return obj;
      });

      return [...out].filter(obj => obj.percent);
    },
  },

  methods: {
    showMenu(show) {
      if (this.$refs.popover) {
        if (show) {
          this.$refs.popover.show();
        } else {
          this.$refs.popover.hide();
        }
      }
    },
  }
};

function toPercent(value, min, max) {
  value = Math.max(min, Math.min(max, value));
  let per = value / (max - min) * 100; // Percent 0-100

  per = Math.floor(per * 100) / 100; // Round to 2 decimal places

  return per;
}

</script>
<template>
  <div class="fleet-status">
    <div class="count">
      {{ meta.total }}
    </div>
    <div class="progress-container">
      <div class="header">
        <div class="title">
          {{ title }}
        </div>
        <div
          class="dropdwon resources-dropdown"
          tabindex="0"
          @blur="showMenu(false)"
          @click="showMenu(true)"
          @focus.capture="showMenu(true)"
        >
          <v-popover
            ref="popover"
            placement="bottom-end"
            offset="-10"
            trigger="manual"
            :delay="{show: 0, hide: 0}"
            :popper-options="{modifiers: { flip: { enabled: false } } }"
            :container="false"
          >
            <div class="meta-title">
              {{ meta.readyCount }} / {{ meta.total }} {{ title }} ready <i class="icon toggle icon-chevron-down" />
            </div>
            <template slot="popover" class="resources-status-list">
              <ul class="list-unstyled dropdown" @click.stop="showMenu(false)">
                <li v-for="(val, idx) in values" :key="idx">
                  <span>{{ val.label }}</span><span class="list-count">{{ val.count }}</span>
                </li>
              </ul>
            </template>
          </v-popover>
        </div>
      </div>
      <div v-trim-whitespace :class="{progress: true, multi: pieces.length > 1}">
        <div
          v-for="(piece, idx) of pieces"
          :key="idx"
          v-trim-whitespace
          :primary-color-var="piece.color"
          :class="{'piece': true, [piece.color]: true}"
          :style="piece.style"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $progress-divider-width: 1px;
  $progress-border-radius: 90px;
  $progress-height:        10px;
  $progress-width:         100%;

  .fleet-status {
    display: flex;
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 10px
  }

  .header {
    display: flex;
    margin-bottom: 15px;
    justify-content: space-between;
  }

  .progress-container {
    width: 100%;
    padding: 15px;

  }

  .count {
    padding: 15px;
    background-color: var(--tabbed-container-bg);
    border-radius: 10px 0 0 10px;
    display: flex;
    align-items: center;
    min-width: 60px;
    justify-content: center;
    font-size: $font-size-h2
  }

  .progress {
    display: block;
    border-radius: $progress-border-radius;
    background-color: var(--progress-bg);
    height: $progress-height;
    width: $progress-width;

    .piece {
      display: inline-block;
      vertical-align: top;
      height: $progress-height;
      border-radius: 0;
      border-right: $progress-divider-width solid var(--progress-divider);
      vertical-align: top;

      &:first-child {
        border-top-left-radius: $progress-border-radius;
        border-bottom-left-radius: $progress-border-radius;
      }

      &:last-child {
        border-top-right-radius: $progress-border-radius;
        border-bottom-right-radius: $progress-border-radius;
        border-right: 0;
      }
    }
  }

  .piece.bg-success:only-child {
    opacity: 0.5;
  }

  .meta-title {
    display: flex;
    align-items: center;

    &:hover {
      cursor: pointer;
      color: var(--link);
    }

    .icon {
      margin: 4px 0 0 5px;
      opacity: 0.3;
    }
  }

  .resources-dropdown {
    li {
        display: flex;
        justify-content: space-between;
        margin: 10px 5px;
    }

    .list-count {
        margin-left: 30px;
    }
 }
</style>
