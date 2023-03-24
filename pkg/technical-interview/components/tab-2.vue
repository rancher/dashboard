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

  computed: {
    currentDateDisplay() {
      return this.currentDate.toLocaleTimeString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})
    },
    newDateDisplay() {
      return this.newDate.toLocaleString()
    },
    dateDifference() {
      if (this.newDate > this.currentDate) {
        return 'after';
      }
      if (this.newDate < this.currentDate) {
        return 'before';
      }

      return 'the same';
    }
  },

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
    }
  },
});
</script>

<template>
  <div>
    <h2>Compare time</h2>

    <p>Current date and time: {{ currentDateDisplay }}</p>
    <p>New date and time: {{ newDateDisplay }}</p>

    <div
      class="mt-3"
    >
      <label>Hours: <input
        v-model.number="hours"
        type="number"
      ></label>
      <label>Minutes: <input
        v-model.number="minutes"
        type="number"
      ></label>
      <label>Seconds: <input
        v-model.number="seconds"
        type="number"
      ></label>
      <button
        class="btn btn-sm role-primary"
        @click="updateDate(hours, minutes, seconds)"
      >
        Update
      </button>
    </div>

    <p 
      class="mt-3"
    >
      New date is {{ dateDifference }} current date.
    </p>
  </div>
</template>
