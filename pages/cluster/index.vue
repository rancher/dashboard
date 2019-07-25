<template>
  <div>
    Cluster Index
    <p>Prefs: {{ this.$store.state.prefs }}</p>
    <p>Favorites: {{ this.$store.state.prefs.dashboard_favorite }}</p>
    <p>Theme: {{ this.$store.state.prefs.theme }}</p>
    <p>Foo: {{ this.$store.state.prefs.foo }}</p>
    <p>Counter: {{ this.$store.state.prefs.counter }}</p>
  </div>
</template>

<script>
export default {
  computed: {
    counter() {
      return this.$store.state.counter;
    },

    prefCounter() {
      return this.$store.state.prefs.counter;
    }
  }
};
</script>
