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
    ranges() {
      return this.row?.spec?.ranges || [];
    }
  }
};
</script>

<template>
  <div class="macvlan-range">
    <div
      v-if="ranges.length === 1"
      class="pull-left macvlan-range-item"
    >
      <span class="inline-block">
        {{ ranges[0].rangeStart }}-{{ ranges[0].rangeEnd }}
      </span>
    </div>

    <v-popover
      v-else-if="ranges.length > 1"
      trigger="click"
      placement="top"
      :delay="{ hide: 0 }"
      open-class="macvlan-range-popover"
      :handle-resize="true"
    >
      <div class="pull-left macvlan-range-item cursor-pointer">
        <span class="inline-block">
          {{ ranges[0].rangeStart }}-{{ ranges[0].rangeEnd }}
        </span>
        <span>
          ···
        </span>
      </div>
      <template slot="popover">
        <div
          v-for="(range, index) in ranges"
          :key="index"
          class="macvlan-range-item macvlan-range-item-popover"
        >
          <div class="text-center">
            {{ range.rangeStart }}-{{ range.rangeEnd }}
          </div>
        </div>
      </template>
    </v-popover>
  </div>
</template>
<style lang='scss' scoped>
  .macvlan-range-item, .macvlan-range-item-popover {
    .text-small{
      line-height: 21px;
    }
    .dst{
      background: #BAD545;
    }
    .macvlan-range-tag {
      color: #fff;
      width: 37px;
      height:16px;
      padding: 1px 5px;
      border-radius: 2px;
      display: inline;
    }
  }
</style>
<style lang='scss' scoped>
  .cursor-pointer{
    cursor: pointer;
  }
  .macvlan-range-popover{
    $color: rgb(244, 245, 250);
    width: 230px;
    .macvlan-range-item-popover{
      border-top: 1px solid black;
      line-height: 21px;
      font-size: 12px;
      &:first-of-type {
        border-top: none;
      }
    }
    .tooltip-inner{
      max-height: 200px;
      overflow-y:scroll;
      background: $color;
    }
  }
</style>
<style lang='scss'>
.macvlan-range-popover{
  .popover-arrow{
    &:after{
      border-top-color: rgb(255, 255, 255) !important;
    }
  }
}
</style>
