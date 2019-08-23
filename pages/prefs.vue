<script>
import { mapPref, THEME } from '~/store/prefs';

export default {
  computed: {
    theme: mapPref(THEME),
    // multi-line
  },
};
</script>

<template>
  <div>
    <h1>Preferences</h1>

    <div v-trim-whitespace class="btn-group">
      <button type="button" :class="{'btn': true, 'bg-default': true, 'active': theme === 'light'}" @click="theme='light'">
        Light
      </button>
      <button type="button" :class="{'btn': true, 'bg-default': true, 'active': theme === 'dark'}" @click="theme='dark'">
        Dark
      </button>
    </div>
  </div>
</template>
