<script>
import day from 'dayjs';
import Time from '@/components/form/SuperDatePicker/Time';
import { ALL_TYPES } from '@/components/form/SuperDatePicker/util';

export default {
  components: { Time },

  props: {
    value: {
      type:     Object,
      required: true
    },
  },

  data() {
    if (this.value.type !== ALL_TYPES.ABSOLUTE.key) {
      this.$set(this.value, 'type', ALL_TYPES.ABSOLUTE.key);
      this.$set(this.value, 'value', day().subtract(1, 'days').startOf('day'));
    }

    return {};
  },

  computed: {
    date: {
      get() {
        return day(this.value.value).valueOf();
      },
      set(value) {
        const hhmm = day(this.value.value).format('HH:mm');
        const [hours, minutes] = hhmm.split(':');
        const newTime = day(value).startOf('day').add(hours, 'hours').add(minutes, 'minutes');

        this.$set(this.value, 'value', newTime);
      }
    },
    time: {
      get() {
        return day(this.value.value).format('HH:mm');
      },
      set(value) {
        const [hours, minutes] = value.split(':');
        const newTime = this.value.value.startOf('day').add(hours, 'hours').add(minutes, 'minutes');

        this.$set(this.value, 'value', newTime);
      }
    }
  },
  methods: {},
};
</script>

<template>
  <div class="absolute">
    <v-date-picker v-model="date" />
    <Time v-model="time" />
  </div>
</template>

<style lang="scss" scoped>
.absolute {
  display: flex;
  flex-direction: row;
  height: 267px;
}
</style>
