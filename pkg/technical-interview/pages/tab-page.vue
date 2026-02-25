<script lang="ts">
import { defineComponent } from 'vue';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';

type TimeComparison = 'before' | 'same' | 'after';

export default defineComponent({
  name: 'TabPage',

  layout: 'plain',

  components: { Tabbed, Tab },

  data() {
    return {
      // Tab 1
      counter: 42,

      // Tab 2
      current:       new Date(),
      offsetHours:   0,
      offsetMinutes: 0,
      offsetSeconds: 0,
      timer:         null
    };
  },

  computed: {
    updated(): Date {
      const newDate = new Date(this.current);

      newDate.setHours(newDate.getHours() + Number(this.offsetHours || 0));
      newDate.setMinutes(newDate.getMinutes() + Number(this.offsetMinutes || 0));
      newDate.setSeconds(newDate.getSeconds() + Number(this.offsetSeconds || 0));

      return newDate;
    },

    timeComparison(): TimeComparison {
      const a = this.current.getTime();
      const b = this.updated.getTime();

      if (a < b) return 'before';
      if (a > b) return 'after';

      return 'same';
    },

    formattedCurrent(): string {
      return this.current.toLocaleString(undefined, {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit'
      });
    },

    formattedUpdated(): string {
      return this.updated.toLocaleString(undefined, {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit'
      });
    }
  },

  mounted() {
    this.timer = setInterval(() => {
      this.current = new Date();
    }, 10000);
  },

  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },

  methods: {
    decrement() {
      if (this.counter > 0) {
        this.counter -= 1;
      }
    }

  },
});
</script>

<template>
  <div>
    <h1>{{ t("interview.tabPage.title") }}</h1>
    <Tabbed>
      <Tab
        name="first"
        label="Tab 1"
      >
        <p class="mb-20">
          Counter: {{ counter }}
        </p>
        <button
          type="button"
          class="btn role-primary"
          :disabled="counter === 0"
          @click="decrement"
        >
          Decrement
        </button>
      </Tab>
      <Tab
        name="second"
        label="Tab 2"
      >
        <div>
          <p><strong>Current:</strong> {{ formattedCurrent }}</p>
          <p><strong>Updated:</strong> {{ formattedUpdated }}</p>
          <p><strong>Result:</strong> {{ timeComparison }}</p>

          <div class="mt-20">
            Hours:
            <input
              v-model="offsetHours"
              type="number"
            >

            Minutes:
            <input
              v-model="offsetMinutes"
              type="number"
            >

            Seconds:
            <input
              v-model="offsetSeconds"
              type="number"
            >
          </div>
        </div>
      </Tab>
    </Tabbed>
  </div>
</template>
