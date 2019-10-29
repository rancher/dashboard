
<script>
import Match from '@/components/cru/rio.cattle.io.v1.router/Match';
import Destination from '@/components/cru/rio.cattle.io.v1.router/Destination';
import RouteTraffic from '@/components/cru/rio.cattle.io.v1.router/Traffic';
export default {
  components: {
    Match, Destination, RouteTraffic
  },
  data() {
    return {
      matches:        [{}],
      to:            [{}],
      traffic: {}
    };
  },
  computed: {},
  methods:  {
    addMatch() {
      this.matches.push({});
    },
    change(type, index, payload) {
      this.$set(this[type], index, payload);
    },
    addDestination() {
      this.to.push({});
    },
    trafficChange(payload) {
      this.traffic = payload;
    },
    checked(e) {
      console.log(e);
    }
  }
};
</script>

<template>
  <div class="route">
    <div id="router" class="row">
      <div class="column matches">
        <template v-for="(match, i) in matches">
          <Match
            :key="i"
            :spec="match"
            @input="change('matches', i, $event)"
          />
          <div v-if="matches.length>i+1" :key="i">
            <hr />
            OR
          </div>
        </template>
        <button class="btn btn-sm bg-primary " @click="addMatch">
          add match condition
        </button>
      </div>
      <div class="destination column">
        <button class="btn btn-sm bg-primary " @click="addDestination">
          add weighted destination
        </button>
        <Destination v-for="(destination, i) in to" :key="i" :is-weighted="true" :spec="to[i]" @input="change('to', i, $event)" />
      </div>
    </div>
    <RouteTraffic class="row" :spec="traffic" @input="trafficChange" />
  </div>
</template>

<style lang='scss'>
.route{
  border: 1px dashed blue;
}
  .column {
    width: 50%;
    padding: 3%;
    border: 1px solid var(--border);
   }
</style>
