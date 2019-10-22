
<script>
import Match from '@/components/cru/rio.cattle.io.v1.route/Match';
import Destination from '@/components/cru/rio.cattle.io.v1.route/Destination';
import RouteTraffic from '@/components/cru/rio.cattle.io.v1.route/RouteTraffic';
export default {
  components: {
    Match, Destination, RouteTraffic
  },
  data() {
    return {
      matches:        [{}],
      host:           '',
      path:           ''
    };
  },
  computed: {},

  methods: {
    addMatch() {
      this.matches.push({});
    },
    destinationChange(result) {
      console.log('changed to: ', result);
    }
  }
};
</script>

<template>
  <div>
    <div class="column matches">
      <button class="btn bg-transparent " @click="addMatch">
        add match condition
      </button>

      <template v-for="(match, i) in matches">
        <Match
          :key="i"
          :match="match"
        />
        <div v-if="matches.length>i+1" :key="i">
          <hr />
          OR
        </div>
      </template>
    </div>
    <div
      class="column between"
    >
      <RouteTraffic />
    </div>
    <div class="destination-container">
      <Destination :is-weighted="true" @input="destinationChange" />
    </div>
  </div>
</template>

<style scoped lang='scss'>
  .column.between{
    display: flex;
    flex-direction: row;
  }
</style>
