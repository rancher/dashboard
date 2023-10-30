<script>
import { get } from '@shell/utils/object';
import { BadgeState } from '@components/BadgeState';
import { mapGetters } from 'vuex';

const carouselSeenStorageKey = `carousel-seen`;

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
      slider:                  this.sliders,
      activeItemId:            0,
      autoScroll:              true,
      autoScrollSlideInterval: null,
    };
  },

  computed: {
    ...mapGetters(['clusterId']),
    trackStyle() {
      let sliderItem = ( this.activeItemId + 1) * 100 / (this.slider.length + 2);
      const width = 60 * (this.slider.length + 2);

      if (this.slider.length === 1) {
        sliderItem = 0;
      }

      return `transform: translateX(-${ sliderItem }%); width: ${ width }%`;
    },

    test() {
      return 'test';
    }
  },

  methods: {
    get,

    select(slide, i) {
      this.$emit('clicked', slide, i);
    },

    scrollSlide(i) {
      this.autoScroll = false;
      this.activeItemId = i;
    },

    nextPrev(direction) {
      this.autoScroll = false;
      const slideTrack = document.getElementById('slide-track');

      slideTrack.style.transition = `transform 450ms ease-in-out`;

      direction !== 'prev' ? (this.activeItemId++) : (this.activeItemId--);

      slideTrack.addEventListener('transitionend', this.slideTransition);
    },

    slideTransition() {
      const slideTrack = document.getElementById('slide-track');
      const slidesArray = this.slider.length + 2;

      if (this.activeItemId === -1) {
        slideTrack.style.transition = 'none';
        this.activeItemId = this.slider.length - 1;
      }
      if (this.activeItemId === slidesArray - 2) {
        slideTrack.style.transition = 'none';
        this.activeItemId = 0;
      }
    },

    autoScrollSlide() {
      if (this.activeItemId < (this.slider.length + 1) && this.autoScroll ) {
        this.activeItemId++;
      }

      if (this.activeItemId > this.slider.length - 1) {
        this.autoScroll = false;
        this.activeItemId = 0;
      }
    },
  },

  beforeDestroy() {
    if (this.autoScrollSlideInterval) {
      clearInterval(this.autoScrollSlideInterval);
    }
  },

  mounted() {
    const slideTrack = document.getElementById('slide-track');

    if (this.slider.length === 1) {
      // singleSlide.style = 'width: 100%; max-width: 100%';
      slideTrack.style = 'transform:translateX(0%); width:100%; left:0';
    } else {
      const node = document.getElementById('slide0');
      const clone = node.cloneNode(true);

      const nodeLast = document.getElementById(`slide${ this.slider.length - 1 }`);
      const cloneLast = nodeLast.cloneNode(true);

      slideTrack.appendChild(clone);
      slideTrack.insertBefore(cloneLast, slideTrack.children[0]);
    }

    const lastSeenCluster = sessionStorage.getItem(carouselSeenStorageKey);

    if (lastSeenCluster !== this.clusterId) {
      // Session storage lasts until tab/window closed (retained on refresh)
      sessionStorage.setItem(carouselSeenStorageKey, this.clusterId);
    }

    this.autoScrollSlideInterval = setInterval(this.autoScrollSlide, 5000);
  },

};

</script>

<template>
  <div
    class="slider"
    :class="{'disable': sliders.length === 1}"
  >
    <div
      id="slide-track"
      ref="slider"
      :style="trackStyle"
      class="slide-track"
    >
      <div
        :is="asLink ? 'a' : 'div'"
        v-for="(slide, i) in sliders"
        :id="`slide` + i"
        ref="slide"
        :key="get(slide, keyField)"
        class="slide"
        :class="{'singleSlide': sliders.length === 1}"
        :href="asLink ? get(slide, linkField) : null"
        :target="get(slide, targetField)"
        :rel="rel"
        @click="select(slide, i)"
      >
        <div class="slide-content">
          <div class="slide-img">
            <img :src="slide.icon ? slide.icon : `/_nuxt/shell/assets/images/generic-catalog.svg`">
          </div>
          <div class="slide-content-right">
            <BadgeState
              :label="slide.repoName"
              color="slider-badge mb-20"
            />
            <h1>{{ slide.chartNameDisplay }}</h1>
            <p>{{ slide.chartDescription }}</p>
          </div>
        </div>
      </div>
    </div>
    <div
      class="controls"
      :class="{'disable': sliders.length === 1}"
    >
      <div
        v-for="(slide, i) in slider"
        :key="i"
        class="control-item"
        :class="{'active': activeItemId === i}"
        @click="scrollSlide(i, slider.length)"
      />
    </div>
    <div
      ref="prev"
      class="prev"
      :class="{'disable': sliders.length === 1}"
      @click="nextPrev('prev')"
    >
      <i class="icon icon-chevron-left icon-4x" />
    </div>
    <div
      ref="next"
      class="next"
      :class="{'disable': sliders.length === 1}"
      @click="nextPrev('next')"
    >
      <i class="icon icon-chevron-right icon-4x" />
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
  // min-width: 700px;

  &.disable::before,
  &.disable::after {
    display: none;
  }

  &.disable:hover {
    .prev,
    .next {
      display: none;
    }
  }

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
  left: 21%;
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
  cursor: pointer;

  &.singleSlide {
    width: 100%;
    max-width: 100%;
  }
  .slide-header {
    background: var(--default);
    width: 100%;
    padding: 10px 15px;
  }
  .slide-content {
    display: flex;
    padding: 30px;
    height: 100%;

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
  &.disable {
    display: none;
  }
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

  &.disable {
    display: none;
  }

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
