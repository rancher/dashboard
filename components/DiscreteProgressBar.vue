<script>
import { TweenLite } from 'gsap/umd/TweenMax';

export default {
  props:    {
    bars: {
      type:    Number,
      default: 10
    },
    progress: {
      type:    Number,
      default: 20
    },
    interval: {
      type:    Number,
      default: 1000
    }
  },
  data() {
    return { animatedProgress: this.progress };
  },
  watch: {
    progress(newProgress, oldProgress) {
      TweenLite.to(this.$data, this.interval / 2000, { animatedProgress: newProgress } );
    }
  }
};
</script>

<template>
  <div class="bar-container">
    <div
      v-for="n in bars"
      :key="n"
      class="progress-bar"
      :class="{ filled: n / bars <= animatedProgress / 100 }"
    />
  </div>
</template>

<style scoped lang="scss">
.bar-container{
  height: 100%;
  width: 100%;
  display: flex;
  /* justify-content: space-between; */
}
.progress-bar {
  height: 100%;
  border-radius: 5%;
  background-color: #6c6c76;
  transition: background-color 0.2s;
  margin-left: 3px;
  width: 3px;
}

.filled {
  background-color: #3d98d3;
  transition: background-color 0.2s;
}
</style>
