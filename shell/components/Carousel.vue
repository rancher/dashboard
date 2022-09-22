<script>
import { get } from '@shell/utils/object';
import { BadgeState } from '@components/BadgeState';

export default {
  components: { BadgeState },
  name:       'Carousel',
  props:      {
    sliders: {
      type:     Array,
      required: true,
    },
    keyField: {
      type:    String,
      default: 'key',
    },
    asLink: {
      type:    Boolean,
      default: false,
    },
    linkField: {
      type:    String,
      default: 'link'
    },
    targetField: {
      type:    String,
      default: 'target',
    },
    rel: {
      type:    String,
      default: 'noopener noreferrer nofollow'
    },
  },
  data() {
    return {
      slider:          this.sliders,
      activeItemId:    0,
      autoScroll:      true
    };
  },

  computed: {

    trackStyle() {
      const sliderItem = this.activeItemId * 100 / this.slider.length;
      const width = 60 * this.slider.length;

      return `transform: translateX(-${ sliderItem }%); width: ${ width }%`;
    },
  },

  methods: {
    get,

    select(slide, i) {
      this.$emit('clicked', slide, i);
    },

    scrollSlide(i) {
      this.autoScroll = false;
      this.activeItemId = i;
      setTimeout(() => {
        this.slidePosition();
      }, 400);
    },

    nextPrev(item) {
      this.autoScroll = false;
      if (item === 'next' && this.activeItemId < this.slider.length - 1) {
        this.activeItemId++;
      }

      if (item === 'prev' && this.activeItemId > 0) {
        this.activeItemId--;
      }

      this.slidePosition();
    },

    timer() {
      setInterval(this.autoScrollSlide, 2000);
    },
    autoScrollSlide() {
      if (this.activeItemId < this.slider.length && this.autoScroll ) {
        this.activeItemId++;
      }

      if (this.activeItemId > this.slider.length - 1) {
        this.autoScroll = false;
        this.activeItemId = 0;
      }
      this.slidePosition();
    },

    slidePosition() {
      if (this.activeItemId <= 1) {
        this.$refs.slide[this.slider.length - 1].style.left = '-93%';
        this.$refs.slide[0].style.left = '7%';
      } else {
        this.$refs.slide[this.slider.length - 1].style.left = '7%';
        this.$refs.slide[0].style.left = '107%';
      }
    }
  },

  mounted() {
    this.timer();
  }
};

</script>

<template>
  <div class="slider">
    <div id="slide-track" ref="slider" :style="trackStyle" class="slide-track">
      <div
        :is="asLink ? 'a' : 'div'"
        v-for="(slide, i) in sliders"
        :id="`slide` + i"
        ref="slide"
        :key="get(slide, keyField)"
        class="slide"
        :href="asLink ? get(slide, linkField) : null"
        :target="get(slide, targetField)"
        :rel="rel"
        @click="select(slide, i)"
      >
        <div class="slide-content">
          <div class="slide-img">
            <img :src="slide.icon ? slide.icon : `/_nuxt/shell/assets/images/generic-catalog.svg`" />
          </div>
          <div class="slide-content-right">
            <BadgeState :label="slide.repoName" color="slider-badge mb-20" />
            <h1>{{ slide.chartNameDisplay }}</h1>
            <p>{{ slide.chartDescription }}</p>
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
    <div ref="prev" class="prev" :class="[activeItemId === 0 ? 'disabled' : 'prev']" @click="nextPrev('prev')">
      <i class="icon icon-chevron-left icon-4x"></i>
    </div>
    <div ref="next" class="next" :class="[activeItemId === slider.length - 1 ? 'disabled' : 'next']" @click="nextPrev('next')">
      <i class="icon icon-chevron-right icon-4x"></i>
    </div>
  </div>
</template>

<style lang='scss' scoped>
 .slider {
  margin: auto;
  position: relative;
  width: 100%;
  place-items: center;
  overflow: hidden;
  margin-bottom: 30px;
  min-width: 700px;

  &:hover {
    .prev,
    .next {
      display: block;
    }
  }
}

.slide-track {
  display: flex;
  animation: scrolls 10s ;
  position: relative;
  transition: 1s ease-in-out;
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
  cursor: pointer;

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
      background: var(--card-badge-text);
      border-radius: calc(2 * var(--border-radius));

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
  background: linear-gradient(to right, var(--slider-light-bg) 0%, var(--slider-light-bg-right) 100%);
  content: "";
  height: 100%;
  position: absolute;
  width: 15%;
  z-index: z-index('overContent');
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
    background: var(--scrollbar-thumb);
    margin: 5px;
    cursor: pointer;

    &.active {
      background:var(--body-text);
    }
  }
}
.prev,
.next {
  position: absolute;
  z-index: 20;
  top: 90px;
  display: none;
  cursor: pointer;

  &.disabled .icon {
    color: var(--disabled-bg);
    cursor: not-allowed;
  }
}

.next {
  right: 0;
}

</style>
