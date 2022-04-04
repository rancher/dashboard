<script>
export default {
  props:      {
    title: {
      type:     String,
      default: 'Test'
    },
    content: {
      type:    String,
      default: 'content'
    }
  }
};

</script>

<template>
  <div class="slider">
    <div class="slide-track">
      <div class="slide">
        <span>{{ title }}</span>
        <span>{{ content }}</span>
      </div>
      <div class="slide">
        Test 2
      </div>
      <div class="slide">
        Test 3
      </div>
      <div class="slide">
        Test 4
      </div>
      <div class="slide">
        Test 1
      </div>
      <div class="slide">
        Test 2
      </div>
      <div class="slide">
        Test 3
      </div>
      <div class="slide">
        Test 4
      </div>
    </div>
    <div class="dots">
      1
    </div>
  </div>
</template>

<style lang='scss'>
 .slider {
  height: 250px;
  margin: auto;
  position: relative;
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: green;
}

.slide-track {
  display: flex;
  width: 100%;
  animation: scroll 40% lin;
}

.slide {
  height: 170px;
  width: 670px;
  display: flex;
  align-items: center;
  margin: 15px;
  background-color: blue;
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
  right: 0;
  top: 0;
  transform: rotate(180deg);
}
</style>
