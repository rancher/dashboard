<template>
  <div>
    <div
      v-for="item in items"
      :key="item.id"
      :class="{ 'active': isSelected(item), 'label': true }"
      @click="toggleSelection(item)"
    >
      <img
        :src="iconSrc"
        width="10"
        height="10"
      >
      <span>{{ item.name }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type:    Array,
      default: () => []
    },
    selected: {
      type:    Array,
      default: () => []
    },
  },
  mounted() {
    this.selectedItems = this.selected.map((item) => item);
  },
  data() {
    return {
      selectedItems: [],
      iconSrc:       require('@pkg/image-repo/assets/image/harbor-icon.svg'),
    };
  },
  methods: {
    toggleSelection(item) {
      const index = this.selectedItems.findIndex((selectedItem) => selectedItem.id === item.id);

      if (index === -1) {
        this.selectedItems.push(item);
      } else {
        this.selectedItems.splice(index, 1);
      }

      this.$emit('itemSelected', this.selectedItems);
    },
    isSelected(item) {
      return this.selectedItems.some((selectedItem) => selectedItem.id === item.id);
    }
  }
};
</script>

<style lang="scss" scoped>
.label {
  position: relative;
  border-radius: 2px;
  background-color: #fff;
  color: #666;
  border: 1px solid #dde6ef;
  padding: 10px;
  cursor: pointer;
  max-width: 300px;
  font-size: 12px;
  display: inline-block;
  line-height: 18px;
  margin: 4px 4px;
  IMG {
    margin-right: 3px
  }
}

.active {
  background-color: #9da3db;
}
</style>
