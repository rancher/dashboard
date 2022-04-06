<script>
const sliderData = [
  {
    id:      '1',
    img:     '~assets/images/featured/img1.jpg',
    partner: 'Partner',
    title:   '1 Upbound Universal Crossplan 1',
    content: 'Upbound Universal Crossplan (Uxp) is Upbounds official enterprise-Grade Distribution of Crossplan',
  },
  {
    id:      '2',
    img:     '~assets/images/featured/img1.jpg',
    partner: 'Partner',
    title:   '2 Upbound Universal Crossplan 2',
    content: 'Upbound Universal Crossplan (Uxp) is Upbounds official enterprise-Grade Distribution of Crossplan',
  },
  {
    id:      '3',
    img:     '~assets/images/featured/img1.jpg',
    partner: 'Partner',
    title:   '3 Upbound Universal Crossplan 3',
    content: 'Upbound Universal Crossplan (Uxp) is Upbounds official enterprise-Grade Distribution of Crossplan',
  },
  {
    id:      '4',
    img:     '~assets/images/featured/img1.jpg',
    partner: 'Partner',
    title:   '4 Upbound Universal Crossplan 4',
    content: 'Upbound Universal Crossplan (Uxp) is Upbounds official enterprise-Grade Distribution of Crossplan',
  },
  {
    id:      '5',
    img:     '~assets/images/featured/img1.jpg',
    partner: 'Partner',
    title:   '5 Upbound Universal Crossplan 5',
    content: 'Upbound Universal Crossplan (Uxp) is Upbounds official enterprise-Grade Distribution of Crossplan',
  }
];

export default {
  name:  'Carousel',
  props:      {
    sliders: {
      type:    Array,
      default: null
    }
  },
  data() {
    return { slider: sliderData };
  },
  methods: {
    goto(event) {
      const elems = document.getElementsByClassName('dot');

      const size = elems.length;
      const targetId = event.currentTarget.id;
      const slider = document.getElementById('slide-track');

      for (let i = 0; i < size; i++) {
        const box = elems[i];

        box.classList.remove('active');
      }

      event.currentTarget.classList.add('active');

      if (targetId === '1') {
        slider.style.transform = 'translateX(0%)';
        slider.style.transition = '1s ease-in-out';
      } else if (targetId === '2') {
        slider.style.transform = 'translateX(-20%)';
        slider.style.transition = '1s ease-in-out';
      } else if (targetId === '3') {
        slider.style.transform = 'translateX(-40%)';
        slider.style.transition = '1s ease-in-out';
      } else if (targetId === '4') {
        slider.style.transform = 'translateX(-60%)';
        slider.style.transition = '1s ease-in-out';
      } else if (targetId === '5') {
        slider.style.transform = 'translateX(-80%)';
        slider.style.transition = '1s ease-in-out';
      }
    },
  }
};

</script>

<template>
  <div class="slider">
    <div id="slide-track" ref="slider" class="slide-track">
      <div v-for="(slide, i) in slider" id="'slide' + slide.id" :key="i" class="slide">
        <div class="slide-header">
          Featured chart
        </div>
        <div class="slide-content">
          <div class="slide-img">
            <img src="~assets/images/featured/img1.jpg" />
          </div>
          <div class="slide-content-right">
            <BadgeState label="Partner" color="slider-badge  mb-20" />
            <h1>{{ slide.title }}</h1>
            <p>{{ slide.content }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="dots">
      <div v-for="(slide, i) in slider" :key="i" class="dot active" @click="goto($event)"></div>
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
  width: calc(60% * 5);
  animation: scrolls 10s ;
  position: relative;
}

  // @keyframes scroll {
  // from {left: 0px;}
  //   to {left  : 200px;}
  // }

  // @keyframes scrolls {
  //   0% {
  //     transform: translateX(0px);
  //   }
  //   100% {
  //     transform: translateX(calc(-830px * 4));
  //   }
  // }

.slider-badge {
  background: var(--app-partner-accent);
  color: var(--body-bg);
}
.slide {
  min-height: 210px;
  width: 60%;
  margin: 0 10px;
  position: relative;
  border: 1px solid var(--tabbed-border);
  border-radius: var(--border-radius);
  left: 7%;

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

.dots {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: gray;
    margin: 5px;

    &.active {
      background: red;
    }
  }
}
</style>
