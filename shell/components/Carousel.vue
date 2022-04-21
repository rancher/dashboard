<script>
import BadgeState from '@/components/BadgeState';

export default {
  components: { BadgeState },
  name:       'Carousel',
  props:      {
    sliders: {
      type:    Array,
      default: null
    }
  },
  data() {
    return {
      slider:          this.sliders,
      activeItemId:    0
    };
  },

  computed: {

    trackStyle() {
      return `transform: translateX(-${ this.activeItemId * 100 / this.slider.length }%); width: calc(${ 60 * this.slider.length }%)`;
    },

  },

  methods: {
    scrollSlide(i) {
      this.activeItemId = i;
      setTimeout(() => {
        if (i <= 1) {
          this.$refs.slide[this.slider.length - 1].style.left = '-93%';
          this.$refs.slide[0].style.left = '7%';
        } else {
          this.$refs.slide[this.slider.length - 1].style.left = '7%';
          this.$refs.slide[0].style.left = '107%';
        }
      }, 400);
    },
  }
};

</script>

<template>
  <div class="slider">
    <div id="slide-track" ref="slider" style="transition: 1s ease-in-out" :style="trackStyle" class="slide-track">
      <div
        v-for="(slide, i) in slider"
        :id="`slide` + i"
        ref="slide"
        :key="i"
        class="slide"
      >
        <div class="slide-header">
          Featured chart
        </div>
        <div class="slide-content">
          <div class="slide-img">
            <img :src="require(`~/assets/images/featured/${slide.img}`)" />
          </div>
          <div class="slide-content-right">
            <BadgeState label="Partner" color="slider-badge  mb-20" />
            <h1>{{ slide.title }}</h1>
            <p>{{ slide.content }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="controls">
      <div
        v-for="(slide, i) in slider"
        :key="i"
        class="control-item"
        :class="{'active': activeItemId === i}"
        @click="scrollSlide(i, slider.length)"
      ></div>
    </div>
  </div>
</template>

<style lang='scss'>
 .slider {
  margin: auto;
  position: relative;
  width: 100%;
  place-items: center;
  overflow: hidden;
  margin-bottom: 30px;
  min-width: 700px;
}

.slide-track {
  display: flex;
  // width: calc(60% * 5);
  animation: scrolls 10s ;
  position: relative;
}

.slider-badge {
  background: var(--app-partner-accent);
  color: var(--body-bg);
}
.slide {
  min-height: 210px;
  width: 60%;
  max-width: 60%;
  margin: 0 10px;
  position: relative;
  border: 1px solid var(--tabbed-border);
  border-radius: var(--border-radius);
  left: 7%;

  &:last-child {
    left: -93%;
  }

  .slide-header {
    background: var(--default);
    width: 100%;
    padding: 10px 15px;
  }
  .slide-content {
    display: flex;
    padding: 30px;

    .slide-img {
      width: 150px;

      img {
        width: 100%;
      }
    }

    .slide-content-right {
      border-left: 1px solid var(--tabbed-border);
      margin-left: 30px;
      padding-left: 30px;

      span {
        margin: 0;
      }

    }
  }

}

.slider::before,
.slider::after {
  background: linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
  content: "";
  height: 100%;
  position: absolute;
  width: 15%;
  z-index: 2;
}

.slider::before {
  left: 0;
  top: 0;
}
.slider::after{
  right: -1px;
  top: 0;
  transform: rotate(180deg);
}

.controls {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;

  .control-item {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--muted);
    margin: 5px;

    &.active {
      background:var(--darker);
    }
  }
}
</style>
