<script>
import { escapeHtml } from '@/utils/string';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import FromToDialog from '@/components/form/SuperDatePicker/FromToDialog';
import { ALL_TYPES } from '@/components/form/SuperDatePicker/util';

export default {
  components: { FromToDialog },

  props: {
    value: {
      type:     Object,
      required: true
    },
  },

  data() {
    return {};
  },
  computed: {
    formattedFromTo() {
      return {
        from: this.format(this.value.from),
        to:   this.format(this.value.to)
      };
    },
    fromValue: {
      get() {
        return {};
      }
    }
  },
  methods: {
    format(time) {
      if (time.type === ALL_TYPES.NOW.key) {
        return 'Now';
      }

      if (time.type === ALL_TYPES.ABSOLUTE.key) {
        const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
        const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));
        const format = `${ dateFormat } ${ timeFormat }`;

        return time.value.format(format);
      }

      const units = this.t(`superDatePicker.${ time.type }`);

      return `${ time.value } ${ units }`;
    }
  },
};
</script>

<template>
  <div class="super-date-picker">
    <v-popover
      placement="bottom"
      trigger="click"
      offset="1"
    >
      <a class="range">{{ formattedFromTo.from }}</a>
      <template #popover>
        <FromToDialog v-model="value.from" />
      </template>
    </v-popover>
    <i class="icon icon-chevron-right" />
    <v-popover
      placement="bottom"
      trigger="click"
      offset="1"
    >
      <a class="range">{{ formattedFromTo.to }}</a>
      <template #popover>
        <FromToDialog v-model="value.to" />
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss" scoped>
    .super-date-picker {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      padding: 10px;

      position: relative;
      width: initial;
      height: 40px;

      background-color: var(--input-bg);
      border: solid var(--border-width) var(--input-border);
      border-radius: var(--border-radius);
      color: var(--input-text);
    }

    .range {
      cursor: pointer;
    }

    .dialogs {
      position: absolute;
      left: 0;
      bottom: 0;

      & > * {
        margin-top: -20px;
        position: absolute;
        left: 0;
        z-index: 100000;
      }
    }
</style>
