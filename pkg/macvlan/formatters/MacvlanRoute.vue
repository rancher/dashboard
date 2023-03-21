<script>
export default {
  name:       'FormatterMacvlanRoute',
  components: {},
  props:      {
    value: {
      type:    [String, Array],
      default: ''
    },
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {};
  },

  computed: {
    routes() {
      return this.row?.spec?.routes || [];
    }
  }
};
</script>

<template>
  <div class="macvlan-route">
    <div
      v-if="routes.length === 1"
      class="pull-left macvlan-route-item"
      style="width: 150px;"
    >
      <div class="text-small">
        <span class="badge-state macvlan-route-tag dst">DST</span>
        {{ routes[0].dst }}
      </div>
      <div class="text-small">
        <span class="bg-warning badge-state macvlan-route-tag">GW</span>
        {{ routes[0].gw }}
      </div>
      <div class="text-small">
        <span class="bg-primary badge-state macvlan-route-tag">Iface</span>
        {{ routes[0].iface }}
      </div>
    </div>
    <v-popover
      v-else-if="routes.length > 1"
      trigger="click"
      placement="top"
      :delay="{hide: 0}"
      open-class="macvlan-route-popover"
      :handle-resize="true"
    >
      <div class="pull-left macvlan-route-item cursor-pointer">
        <div class="text-small">
          <span class="badge-state macvlan-route-tag dst">DST</span>
          {{ routes[0].dst }}
        </div>
        <div class="text-small">
          <span class="bg-warning badge-state macvlan-route-tag">GW</span>
          {{ routes[0].gw }}
        </div>
        <div class="text-small">
          <span class="bg-primary badge-state macvlan-route-tag">Iface</span>
          {{ routes[0].iface }}
        </div>
      </div>

      <div
        class="text-center pull-left"
        style="line-height: 63px; width: 20px;"
      >
        ···
      </div>
      <template slot="popover">
        <div
          v-for="(route, index) in routes"
          :key="index"
          class="macvlan-route-item macvlan-route-item-popover "
        >
          <div class="text-small">
            <span class="badge-state macvlan-route-tag dst">DST</span>
            {{ route.dst }}
          </div>
          <div class="text-small">
            <span class="bg-warning badge-state macvlan-route-tag">GW</span>
            {{ route.gw }}
          </div>
          <div class="text-small">
            <span class="bg-primary badge-state macvlan-route-tag">Iface</span>
            {{ route.iface }}
          </div>
        </div>
      </template>
    </v-popover>
  </div>
</template>
<style lang='scss' scoped>
  .cursor-pointer{
    cursor: pointer;
  }
  .macvlan-route-item, .macvlan-route-item-popover {
    .text-small{
      line-height: 21px;
    }
    .dst{
      background: #BAD545;
    }
    .macvlan-route-tag {
      color: #fff;
      width: 37px;
      height:16px;
      padding: 1px 5px;
      border-radius: 2px;
      display: inline;
    }
  }
</style>
<style lang='scss'>
  .macvlan-route-popover{
    .macvlan-route-item-popover{
      border-top: 1px solid black;
      &:first-of-type {
        border-top: none;
      }
    }
    .tooltip-inner{
      max-height: 300px;
      overflow-y:scroll;
      background: rgb(244, 245, 250);
    }
    .popover-arrow{
      &:after{
        border-top-color: rgb(255, 255, 255) !important;
      }
    }
  }
</style>
