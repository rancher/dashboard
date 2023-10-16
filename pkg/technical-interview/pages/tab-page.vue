<script lang="ts">
import Vue from 'vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import FileSelector from '@shell/components/form/FileSelector.vue';

interface Data {
  count: number,
  now: Date,
  second:string,
  minute: string,
  hour: string,
  palindromeInput: string,
  parsedJson: string
}
type FileContent = {
  name: string,
  value: string,
}
type JsonContent = Record<string, any>;

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    Tab, Tabbed, FileSelector
  },

  layout: 'plain',
  created() {
    setInterval(() => {
      this.now = new Date();
      // this.currentTime = this.formatDate(this.now, false);
    }, 1000);
  },
  data() {
    return {
      count:                0,
      now:                  new Date(),
      timeCompareToCurrent: 'same',
      second:               '',
      minute:               '',
      hour:                 '',
      parsedJson:           '',
      palindromeInput:      ''
    };
  },
  watch: {
    now() {
      this.compareTime();
    },
    updatedTime() {
      this.compareTime();
    },
  },
  computed: {
    updatedTime() {
      const time = new Date();

      if (this.hour !== '') {
        time.setHours(this.hour);
      }
      if (this.minute !== '') {
        time.setMinutes(this.minute);
      }
      if (this.second !== '') {
        time.setSeconds(this.second);
      }

      return time;
    },
    isPalindrome() {
      if (this.palindromeInput === '') {
        return true;
      }
      const len = this.palindromeInput.length;

      const input = this.palindromeInput;
      let i = 0;
      let j = len - 1;

      while (i < j) {
        while (input[i] === ' ') {
          i += 1;
        }
        while (input[j] === ' ') {
          j -= 1;
        }
        if (input[i].toLowerCase() !== input[j].toLowerCase()) {
          return false;
        }

        i += 1;
        j -= 1;
      }

      return true;
    }
  },

  methods: {
    increase() {
      this.count += 1;
    },
    formatDate(datetime: Date, showSecond: boolean) {
      const date = String(datetime.getDate()).padStart(2, '0');
      const month = String(datetime.getMonth() + 1).padStart(2, '0');
      const year = datetime.getFullYear();
      const hour = String(datetime.getHours()).padStart(2, '0');
      const minute = String(datetime.getMinutes()).padStart(2, '0');
      const second = (showSecond) ? `:${ String(datetime.getSeconds()).padStart(2, '0') }` : '';

      return `${ hour }:${ minute }${ second } - ${ date }/${ month }/${ year }`;
    },
    compareTime() {
      const newDate = new Date();

      if (newDate < this.updatedTime) {
        this.timeCompareToCurrent = 'after';
      } else if (newDate > this.updatedTime) {
        this.timeCompareToCurrent = 'before';
      } else {
        this.timeCompareToCurrent = 'same';
      }
    },
    read_and_swap_json(fileContent:FileContent) {
      try {
        const jsonContent = JSON.parse(fileContent.value);
        const swapContent:JsonContent = {};

        for (const key in jsonContent) {
          if (typeof jsonContent[key] !== 'object') {
            jsonContent[jsonContent[key]] = key;
            swapContent[jsonContent[key]] = key;
          } else {
            swapContent[key] = jsonContent[key];
          }
        }
        this.parsedJson = JSON.stringify(swapContent, null, 2).trim();
      } catch (error) {
        alert(error);
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
        name="increment"
        :weight="4"
      >
        <div style="display:flex; align-items:baseline;">
          <button
            style="background: var(--accent-btn)"
            type="button"
            @click="increase"
          >
            increase
          </button>
          <h3 style="margin-left: 20px;">
            Count: {{ count }}
          </h3>
        </div>
      </Tab>
      <Tab
        name="datetime"
        :weight="3"
      >
        <h3>Current Time:{{ formatDate(now, false) }}</h3>
        <h3>Updated Time: {{ formatDate(updatedTime, true) }}</h3>

        <div style="display: flex;">
          <select
            v-model="hour"
          >
            <option
              value=""
              selected
              disabled
              hidden
            >
              Hour
            </option>
            <option
              v-for="val in Array.from(Array(24).keys())"
              :key="val"
            >
              {{ val }}
            </option>
          </select>
          <select v-model="minute">
            <option
              value=""
              selected
              disabled
              hidden
            >
              Minute
            </option>
            <option
              v-for="val in Array.from(Array(60).keys())"
              :key="val"
            >
              {{ val }}
            </option>
          </select>
          <select v-model="second">
            <option
              value=""
              selected
              disabled
              hidden
            >
              Second
            </option>
            <option
              v-for="val in Array.from(Array(60).keys())"
              :key="val"
              :value="val"
            >
              {{ val }}
            </option>
          </select>
        </div>
        <h3>
          Updated time is <span style="color: antiquewhite; font-size: 2rem;"> {{ timeCompareToCurrent }} </span>current time.
        </h3>
      </Tab>
      <Tab
        name="json value swap"
        :weight="2"
      >
        <FileSelector
          style="background: var(--accent-btn)"
          label="Select a json file"
          :include-file-name="true"
          @selected="read_and_swap_json"
        />
        <pre>
          {{ parsedJson }}
        </pre>
      </Tab>
      <Tab
        name="palindrome"
        :weight="1"
      >
        <h3>
          <label>Input Sting:</label>
          <input
            v-model="palindromeInput"
            label="Label"
            type="text"
          >
        </h3>
        <h3>
          <span>Is the input a <strong>palindrome</strong>: <span style="color: bisque;">{{ isPalindrome }}</span></span>
        </h3>
      </Tab>
    </tabbed>
  </div>
  </Tabbed>
  </div>
</template>
