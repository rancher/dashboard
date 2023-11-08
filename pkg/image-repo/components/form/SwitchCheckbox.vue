<template>
  <label
    class="switch-for-harbor"
    @click="toggleChange"
  >
    <input
      :checked="checked"
      :value="checked"
      type="checkbox"
      @click.stop.prevent
    >
    <div />
    <span class="public">{{ t('harborConfig.form.accessLevel.checkPublic') }}</span>
    <span class="private">{{ t('harborConfig.form.accessLevel.checkPrivate') }}</span>
  </label>
</template>

<script>
export default {
  name:  'SwitchCheckbox',
  props: {
    checked: {
      type:    Boolean,
      default: false,
    },
  },
  methods: {
    toggleChange() {
      this.$emit('toggle-change');
    },
  },
};
</script>

<style lang="scss" scoped>
.switch-for-harbor {
  display: inline-block;
  font-size: 13px;
  height: 2em;
  width: 5.8em;
  background: var(--primary);
  border-radius: 2.5em;
  position: relative;
  div {
    height: 20px;
    width: 20px;
    border-radius: 20px;
    background: #FFF;
    box-shadow: 0 0.1em 0.3em rgba(0,0,0,0.3);
    -webkit-transition: all 300ms;
    -moz-transition: all 300ms;
    transition: all 300ms;
    top: 3px;
    left: 4px;
    position: relative;
  }
  input {
    display: none;
  }
  .private {
    position: absolute;
    line-height: 2.2em;
    left: 40px;
    display: inline-block;
    color: #fff;
    top: 0px;
    font-size: 12px;
  }
  .public {
    position: absolute;
    line-height: 2.2em;
    left: 10px;
    color: #fff;
    top: 0px;
    display: none;
    font-size: 12px;
  }
  input:checked + div + .public {
    display: inline-block;
  }
  input:checked + div + .public + .private {
    display: none;
  }
  input:checked + div {
    background: #FFF;
    -webkit-transform: translate3d(230%, 0, 0);
    -moz-transform: translate3d(230%, 0, 0);
    transform: translate3d(230%, 0, 0);
  }
}
</style>
