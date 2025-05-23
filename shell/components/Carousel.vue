<script>
import { get } from '@shell/utils/object';
import { BadgeState } from '@components/BadgeState';
import { mapGetters } from 'vuex';

const carouselSeenStorageKey = `carousel-seen`;

export default {
  emits: ['clicked'],

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
      isTransitionning:        false, // prevents showing empty spaces caused by aggressive clicking
      shouldDisableTransition: false // smoothes the move from the first/last slides to the previous/next slide
    };
  },

  computed: {
    ...mapGetters(['clusterId']),
    trackStyle() {
      if (this.slider.length === 1) {
        return `
          width: 100%;
          left: 0%;
        `;
      }

      const width = 60 * (this.slider.length + 2);
      const left = -(40 + this.activeItemId * 60);

      return `
        width: ${ width }%;
        left: ${ left }%;
        transition: ${ this.shouldDisableTransition ? 'none' : '700ms ease-in-out' };
      `;
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
      if (this.isTransitionning) {
        return;
      }

      this.isTransitionning = true;
      this.autoScroll = false;
      this.shouldDisableTransition = false;
      const slideTrack = this.$refs.slider;

      direction !== 'prev' ? (this.activeItemId++) : (this.activeItemId--);

      slideTrack.addEventListener('transitionend', this.slideTransition);
    },

    slideTransition() {
      const slidesArray = this.slider.length + 2;

      if (this.activeItemId === -1) {
        this.shouldDisableTransition = true;
        this.activeItemId = this.slider.length - 1;
      }

      if (this.activeItemId === slidesArray - 2) {
        this.shouldDisableTransition = true;
        this.activeItemId = 0;
      }

      this.isTransitionning = false;
    },

    autoScrollSlide() {
      if (!this.autoScroll) {
        return;
      }

      if (this.activeItemId < (this.slider.length + 1)) {
        this.activeItemId++;
      }

      if (this.activeItemId > this.slider.length - 1) {
        this.autoScroll = false;
        this.activeItemId = 0;
      }
    },
  },

  beforeUnmount() {
    if (this.autoScrollSlideInterval) {
      clearInterval(this.autoScrollSlideInterval);
    }
  },

  mounted() {
    const slideTrack = this.$refs.slider;

    if (this.slider.length > 1) {
      const firstSlide = this.$refs['slide0']?.[0];

      if (firstSlide) {
        const clone = firstSlide.cloneNode(true);

        slideTrack.appendChild(clone);
      }

      const lastSlide = this.$refs[`slide${ this.slider.length - 1 }`]?.[0];

      if (lastSlide) {
        const cloneLast = lastSlide.cloneNode(true);

        slideTrack.insertBefore(cloneLast, slideTrack.children[0]);
      }
    }

    const lastSeenCluster = sessionStorage.getItem(carouselSeenStorageKey);

    if (lastSeenCluster !== this.clusterId) {
      // Session storage lasts until tab/window closed (retained on refresh)
      sessionStorage.setItem(carouselSeenStorageKey, this.clusterId);
    }

    this.autoScrollSlideInterval = setInterval(this.autoScrollSlide, 5000);
  }

};

</script>

<template>
  <div
    class="slider"
    :class="{'disabled': sliders.length === 1}"
  >
    <div
      id="slide-track"
      ref="slider"
      :style="trackStyle"
      class="slide-track"
    >
      <component
        :is="asLink ? 'a' : 'div'"
        v-for="(slide, i) in sliders"
        :id="`slide${i}`"
        :ref="`slide${i}`"
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
              color="slide-badge mb-20"
            />
            <h1>{{ slide.chartNameDisplay }}</h1>
            <p>{{ slide.chartDescription }}</p>
          </div>
        </div>
      </component>
    </div>
    <div
      role="button"
      class="prev"
      :aria-label="t('carousel.previous')"
      :aria-disabled="sliders.length === 1"
      :class="{'disabled': sliders.length === 1}"
      tabindex="0"
      @click="nextPrev('prev')"
      @keyup.enter.space="nextPrev('prev')"
    >
      <i
        class="icon icon-chevron-left icon-4x"
      />
    </div>
    <div
      role="button"
      class="next"
      :aria-label="t('carousel.next')"
      :aria-disabled="sliders.length === 1"
      :class="{'disabled': sliders.length === 1}"
      tabindex="0"
      @click="nextPrev('next')"
      @keyup.enter.space="nextPrev('next')"
    >
      <i
        class="icon icon-chevron-right icon-4x"
      />
    </div>
    <div
      v-if="sliders.length > 1"
      class="controls"
    >
      <div
        v-for="(slide, i) in slider"
        :key="i"
        class="control-item"
        :class="{'active': activeItemId === i}"
        role="button"
        tabindex="0"
        :aria-label="t('carousel.controlItem', { number: i+1 })"
        @click="scrollSlide(i, slider.length)"
        @keyup.enter.space="scrollSlide(i, slider.length)"
      />
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
  height: 245px;

  &.disabled::before,
  &.disabled::after {
    display: none;
  }
}

.slide-track {
  display: flex;
  position: absolute;
  top: 0;
}

.slide-badge {
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
      align-self: flex-start;
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
  &.disabled {
    display: none;
  }
}
.slider::after{
  right: -1px;
  top: 0;
  transform: rotate(180deg);
}

.controls {
  position: absolute;
  bottom: 0;
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
  cursor: pointer;

  &.disabled .icon {
    color: var(--disabled-bg);
    cursor: not-allowed;
  }

  .icon:focus-visible {
    @include focus-outline;
  }
}

.next {
  right: 0;
}

</style>
