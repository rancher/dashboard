<script lang="ts">
import Vue from 'vue';

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return {
      currentDate: new Date(),
      newDate:     new Date(),
      hours:       0,
      minutes:     0,
      seconds:     0,
    };
  },

  computed: {},

  methods: {
    updateDate(hours: number, minutes: number, seconds: number) {
      this.newDate = new Date();

      this.newDate.setHours(this.newDate.getHours() + hours);
      this.newDate.setMinutes(this.newDate.getMinutes() + minutes);
      this.newDate.setSeconds(this.newDate.getSeconds() + seconds);
      this.resetInputs();
    },

    resetInputs() {
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
    },

    compareDates() {
      if (this.newDate > this.currentDate) {
        return 'after';
      }
      if (this.newDate < this.currentDate) {
        return 'before';
      }

      return 'the same';
    }
  },
});
</script>

<template>
  <div>
    Tab 2

    <p>Current date and time: {{ currentDate.toLocaleString() }}</p>
    <p>New date and time: {{ newDate.toLocaleString() }}</p>
    <p>New date is {{ compareDates() }} current date.</p>
    <label>Hours: <input
      v-model.number="hours"
      type="number"
    ></label><br>
    <label>Minutes: <input
      v-model.number="minutes"
      type="number"
    ></label><br>
    <label>Seconds: <input
      v-model.number="seconds"
      type="number"
    ></label><br>
    <button @click="updateDate(hours, minutes, seconds)">
      Update
    </button>
  </div>
</template>
