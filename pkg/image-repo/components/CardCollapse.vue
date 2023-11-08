<script>
import DropDownMenu from '@pkg/image-repo/components/DropDownMenu.vue';

export default {
  components: { DropDownMenu },
  name:       'CardCollapse',
  props:      {
    open: {
      type:    Boolean,
      default: true
    },
    showAction: {
      type:    Boolean,
      default: false
    },
    title: {
      type:    String,
      default: ''
    },
    label: {
      type:    String,
      default: ''
    },
    customActions: {
      type:    Array,
      default: () => {
        return [];
      }
    },
  },
  data() {
    return {
      showActionMenu:      false,
      customTargetElement: null,
      dropDownMenuVisible: false,
    };
  },
  methods: {
    showAdvanced() {
      this.$emit('update:open', !this.open);
    },
    actionHandleClick(e) {
      e.stopPropagation();
      e.preventDefault();
      this.customTargetElement = e.srcElement;
      this.showActionMenu = true;
    },
    actions(record) {
      if (record) {
        record.event.stopPropagation();
        record.event.preventDefault();
      }
      this.dropDownMenuVisible = false;
    },
    visibleChange(open) {
      this.dropDownMenuVisible = open;
    },
    show() {
      this.dropDownMenuVisible = true;
    }
  }
};
</script>

<template>
  <div class="collapse">
    <slot name="title">
      <div
        class="advanced"
        data-testid="card-collapse-div"
        @click="showAdvanced"
      >
        <div class="expand-icon">
          <i
            v-if="open"
            class="icon icon icon-play eased"
            data-testid="card-collapse-icon-down"
          />
          <i
            v-else
            class="icon icon-play icon-rotate-90 eased"
            data-testid="card-collapse-icon-right"
          />
        </div>
        <div class="title">
          <span>{{ title }}</span>
          <span class="label">{{ label }}</span>
        </div>
        <DropDownMenu
          :options="customActions"
          @custom-event="actions"
        />
      </div>
    </slot>
    <div
      v-if="open"
      class="content"
      data-testid="card-collapse-content"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.advanced {
  user-select: none;
  padding: 0 5px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  border: solid 1px var(--drag-over-inner-bg);
  padding: 5px;
  background: #eeeff3;
  display: flex;
  color: #454545;
}
.expand-icon {
  width: 30px;
  text-align: center;
  display: table-cell;
  line-height: 40px;
  vertical-align: middle;
  background: 0 0;
  color: #268bcf;
}
.title {
  width: 100%;
  font-weight: 400;
  padding: 3px 0;
  flex-direction: column;
  display: flex;
  justify-content: space-between;
}
.title > .label {
  font-size: .8em;
  margin: 0;
  color: #6c6c76;
  display: block;
}
.action {
  width: 40px;
  text-align: center;
  display: table-cell;
  line-height: 40px;
  margin-right: 10px;
  color: #268bcf;
  cursor: pointer;
}
.content {
  background: var(--nav-active);
  position: relative;
  padding: 20px;
  border: solid 1px #dcdee7;
  border-top: 0;
  background-color: #fff;
}
.eased {
  transition: all .5s ease;
}
</style>
