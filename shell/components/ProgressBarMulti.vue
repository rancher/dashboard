<script>
import { sortBy } from '@shell/utils/sort';
import { get } from '@shell/utils/object';

export default {
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
    }
  },

  computed: {
    pieces() {
      const out = [];

      for ( const obj of this.values ) {
        const color = get(obj, this.colorKey);
        const label = get(obj, this.labelKey);
        const value = get(obj, this.valueKey);

        if ( value === 0 && !this.showZeros) {
          continue;
        }

        out.push({
          color,
          label,
          value,
        });
      }

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

      for ( const obj of out ) {
        const percent = Math.max(minPercent, toPercent(obj.value, min, max));

        obj.percent = percent;
        sum += percent;
      }

      // If the sum is bigger than 100%, take it out of the biggest piece
      if ( sum > 100 ) {
        sortBy(out, 'percent', true)[0].percent -= sum - 100;
      }

      for ( const obj of out ) {
        obj.style = `width: ${ obj.percent }%`;
      }

      return out.filter(obj => obj.percent);
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
  <div v-trim-whitespace :class="{progress: true, multi: pieces.length > 1}">
    <div
      v-for="(piece, idx) of pieces"
      :key="idx"
      v-trim-whitespace
      :class="{'piece': true, [piece.color]: true}"
      :style="piece.style"
    />
  </div>
</template>

<style lang="scss" scoped>
  $progress-divider-width: 1px;
  $progress-border-radius: 90px;
  $progress-height:        10px;
  $progress-width:         100px;

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
</style>
