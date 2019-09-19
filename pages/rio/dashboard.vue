<script>
import * as d3 from 'd3';
import AspectPreserver from '@/components/charts/AspectPreserver';
import LinePlot from '@/components/charts/LinePlot';
import ProgressArc from '@/components/charts/ProgressArc';
export default {
  components: {
    AspectPreserver, ProgressArc, LinePlot
  },
  data() {
    return {
      set1:   {
        points: [0, 5, 4, 3, 8],
        domain: [0, 5000]
      },
      set2: {
        points: [0, 0, 0, 0, 0],
        domain: [0, 100]
      },
      set3: {
        points: [0, 0, 0, 0, 0],
        domain: [0, 10]
      },
      mostlyZeroes: {
        points: [0, 0, 1, 0, 0],
        domain: [0, 10]
      },
      random:   this.update(),
      interval: 1000
    };
  },
  methods:  {
    update() {
      if (this.set1) {
        this.set1.points.push(Math.random() * 5000);
        this.set1.points.shift();
      } if (this.set2) {
        this.set2.points.push(Math.random() * 100);
        this.set2.points.shift();
      }
      if (this.set3) {
        this.set3.points.push(Math.random() * 10);
        this.set3.points.shift();
      }
      this.timer = setTimeout(() => {
        this.update();
      }, this.interval);

      return this.random;
    }
  }
};

</script>
<template>
  <div :style="{padding:'1px'}">
    <div class="row">
      <div id="totals" class="metric">
        <div>
          <span class="metric--value"> 3</span>
          <span class="metric--subtext">services monitored</span>
        </div>
        <div>
          <span class="metric--value">5</span>
          <span class="metric--subtext">instances</span>
        </div>
      </div>
      <div id="success" class="metric">
        <AspectPreserver v-slot:default="aspectData" class="metric--graph" :aspect-ratio="[4,4]">
          <ProgressArc :graph-width="aspectData.graphWidth" :progress="set2.points[3]" :tween="true" />
        </aspectpreserver>
        <span class="metric--value">{{ set2.points[3].toFixed(0) }}%</span>
        <span class="metric--subtext">Global Success Rate</span>
      </div>
      <div id="rps" class="metric">
        <AspectPreserver id="req-volume" v-slot:default="aspectData" class="metric--graph" :aspect-ratio="[16,9]">
          <LinePlot
            :graph-width="aspectData.graphWidth"
            :graph-height="aspectData.graphHeight"
            :data-sets="[set1]"
          />
        </AspectPreserver>
        <span class="metric--value">
          {{ (set1.points[0]/1000).toFixed(2) }}K rps
        </span>
        <span class="metric--subtext">Global Request Rate</span>
      </div>
      <div id="errors--4" class="metric">
        <AspectPreserver v-slot:default="aspectData" class="metric--graph" :aspect-ratio="[16,9]">
          <LinePlot
            :graph-width="aspectData.graphWidth"
            :graph-height="aspectData.graphHeight"
            :data-sets="[mostlyZeroes]"
          />
        </AspectPreserver>
        <span class="metric--value">
          {{ 0 }}K rps
        </span>
        <span class="metric--subtext">4xx errors</span>
      </div>
      <div id="errors--5" class="metric">
        <AspectPreserver v-slot:default="aspectData" class="metric--graph" :aspect-ratio="[16,9]">
          <LinePlot
            :graph-width="aspectData.graphWidth"
            :graph-height="aspectData.graphHeight"
            :data-sets="[mostlyZeroes]"
          />
        </AspectPreserver>
        <span class="metric--value">
          {{ 0 }}K rps
        </span>
        <span class="metric--subtext">5xx errors</span>
      </div>
    </div>
    <div class="row">
      <div class="metric">
        <span class="metric--title">Success Rates</span>
        <AspectPreserver v-slot:default="aspectData" class="metric--graph" :aspect-ratio="[16,9]">
          <LinePlot
            :graph-width="aspectData.graphWidth"
            :graph-height="aspectData.graphHeight"
            :data-sets="[set1, set2, set3]"
          />
        </AspectPreserver>
      </div>
      <div class="metric">
        <span class="metric--title">Request Volumes</span>
        <AspectPreserver v-slot:default="aspectData" class="metric--graph" :aspect-ratio="[16,9]">
          <LinePlot
            :graph-width="aspectData.graphWidth"
            :graph-height="aspectData.graphHeight"
            :data-sets="[set1, set2]"
          />
        </AspectPreserver>
      </div>
      <div class="metric">
        <span class="metric--title">Latency</span>
        <AspectPreserver v-slot:default="aspectData" class="metric--graph" :aspect-ratio="[16,9]">
          <LinePlot
            :graph-width="aspectData.graphWidth"
            :graph-height="aspectData.graphHeight"
            :data-sets="[set1, set2]"
          />
        </AspectPreserver>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .row {
    color: rgba(255,255,255, 0.6);
    display: flex;
    width: 100%;
    height: 100%;

    &:nth-of-type(1){
      background-color: rgba(255,255,255,0.02);
      outline: 20px solid rgba(255,255,255,0.02)
    }
  }
  .metric{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    margin: 5px;
    flex-grow:1;
    flex-basis:0%;

    &--value{
      font-size: 3em;
      font-weight: 100
    }
    &--subtext {
          text-transform: uppercase;
    }

    &--graph{
      flex-basis: 0%;
      padding: 5%;
      padding-top: 1%;
    }

    &--title{
      width: 100%;
      padding: 5%;
    }
  }

  #success .metric--graph{
    width: 60%;
  }

  #totals {
    & > * {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      flex-grow: 1;
      border-right: 1px solid rgba(255,255,255,0.2);
      padding: 2%;
      &:nth-child(1){
        border-bottom:  1px solid rgba(255,255,255,0.2);
      }
    }
    & span{
      padding: 3%;
    }
  }
</style>
