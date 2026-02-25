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
      timer:         null,

      // Tab 3
      jsonText:   '',
      jsonObj:    null as Record<string, unknown> | null,
      swappedObj: null as Record<string, string> | null,
      jsonError:  '',

      // Tab 5
      bracketInput:  '',
      bracketResult: null as boolean | null,
    };
  },

  computed: {
    // Tab 2
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
    },

    // Tab 3
    originalJsonPretty(): string {
      if (this.jsonObj) return JSON.stringify(this.jsonObj, null, 2);
      if (this.jsonText) return this.jsonText;

      return '—';
    },

    swappedJsonPretty(): string {
      if (this.swappedObj) return JSON.stringify(this.swappedObj, null, 2);

      return '—';
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
    // Tab 1
    decrement() {
      if (this.counter > 0) {
        this.counter -= 1;
      }
    },

    // Tab 3
    onJsonFileChange(e) {
      const file = e.target.files[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const text = String(reader.result || '');

          this.jsonText = text;
          this.jsonObj = JSON.parse(text);
          this.jsonError = '';
          this.swappedObj = null;
        } catch {
          this.jsonError = 'Invalid JSON';
          this.jsonObj = null;
        }
      };

      reader.readAsText(file);
    },

    swapJson() {
      if (!this.jsonObj) return;

      const result = {};

      for (const key in this.jsonObj) {
        const value = this.jsonObj[key];

        // primitive → swap
        if (
          value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
        ) {
          result[String(value)] = key;

          // object or array - keep same
        } else {
          result[key] = value;
        }
      }

      this.swappedObj = result;
    },

    // Tab 5
    checkBrackets() {
      const str = this.bracketInput;
      const stack: string[] = [];

      const pairs: Record<string, string> = {
        ')': '(',
        ']': '[',
        '}': '{'
      };

      for (const char of str) {
        if (char === '(' || char === '[' || char === '{') {
          stack.push(char); // push opening bracket
        } else if (char === ')' || char === ']' || char === '}') {
          const last = stack.pop(); // closing bracket

          if (last !== pairs[char]) {
            this.bracketResult = false;

            return;
          }
        }
      }

      // valid only if nothing left open
      this.bracketResult = stack.length === 0;
    },
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
      <Tab
        name="third"
        label="Tab 3"
      >
        <div>
          <p class="mb-10">
            Upload JSON file:
          </p>

          <input
            type="file"
            accept=".json"
            @change="onJsonFileChange"
          >

          <br><br>

          <button
            type="button"
            class="btn role-primary"
            :disabled="!jsonObj"
            @click="swapJson"
          >
            Swap
          </button>

          <p
            v-if="jsonError"
            style="color:red;"
          >
            {{ jsonError }}
          </p>

          <h4 class="mt-10">
            Original:
          </h4>
          <pre>{{ originalJsonPretty }}</pre>

          <h4>Swapped:</h4>
          <pre>{{ swappedJsonPretty }}</pre>
        </div>
      </Tab>
      <Tab
        name="fourth"
        label="Tab 4"
      >
        <div>
          <p>
            Tab 4 (Coin Change) not implemented within the time limit of 6h.
          </p>
        </div>
      </Tab>
      <Tab
        name="fifth"
        label="Tab 5"
      >
        <div>
          <p class="mb-10">
            Enter brackets string:
          </p>

          <input
            v-model="bracketInput"
            placeholder="e.g. [()]{}"
            style="width:300px"
          >

          <br><br>

          <button
            type="button"
            class="btn role-primary"
            @click="checkBrackets"
          >
            Check
          </button>

          <p
            v-if="bracketResult !== null"
            class="mt-10"
          >
            Result:
            <strong>
              {{ bracketResult }}
            </strong>
          </p>
        </div>
      </Tab>
    </Tabbed>
  </div>
</template>
