<!-- <script lang="ts">
import { mapGetters } from 'vuex';
import { AUTO, CENTER, fitOnScreen } from '@shell/utils/position';
import { isAlternate } from '@shell/utils/platform';
import IconOrSvg from '@shell/components/IconOrSvg.vue';
import { ref } from 'vue';

const HIDDEN = 'hide';
const CALC = 'calculate';
const SHOW = 'show';

export interface Props {
  options: any[];
  open: boolean;
  componentTestid?: string;

  onClose?: () => void;
}

</script>

<script lang="ts" setup>

const { options, open, componentTestid } = defineProps<Props>();
const emit = defineEmits(['close']);

const style = ref<any>({});
const root = ref<HTMLElement | null>(null);

const execute = () => {};
const hide = () => emit('close');

const updateStyle = () => {
  if ( this.phase === SHOW && !this.useCustomTargetElement) {
    const menu = root.value?.querySelector && root.value.querySelector('.menu');
    const event = this.targetEvent;
    const elem = this.targetElem;

    // If the action menu state is controlled with Vuex,
    // use the target element and the target event
    // to position the menu.
    style.value = fitOnScreen(menu, elem || event, {
      overlapX:  true,
      fudgeX:    elem ? -2 : 0,
      fudgeY:    elem ? 20 : 0,
      positionX: (elem ? AUTO : CENTER),
      positionY: AUTO,
    });
    style.value.visibility = 'visible';

    return;
  }

  if ( this.open && this.useCustomTargetElement) {
    const menu = root.value?.querySelector && root.value.querySelector('.menu');
    const elem = this.customTargetElement;

    // If the action menu state is controlled with
    // props, use the target element to position the menu.
    style.value = fitOnScreen(menu, elem, {
      overlapX:  true,
      fudgeX:    elem ? 4 : 0,
      fudgeY:    elem ? 4 : 0,
      positionX: (elem ? AUTO : CENTER),
      positionY: AUTO,
    }, true );

    style.value.visibility = 'visible';

    return;
  }

  style.value = {};
}, ;
</script>

<template>
  <div v-if="open" ref="root">
    <div
      class="background"
      @click="hide"
      @contextmenu.prevent
    />
    <ul
      class="list-unstyled menu"
      :style="style"
    >
      <li
        v-for="(opt, i) in options"
        :key="i"
        :disabled="opt.disabled ? true : null"
        :class="{divider: opt.divider}"
        :data-testid="componentTestid + '-' + i + '-item'"
        :tabindex="opt.divider ? -1 : 0"
        @click="execute(opt, $event)"
        @keyup.enter="execute(opt, $event)"
        @keyup.space="execute(opt, $event)"
      >
        <IconOrSvg
          v-if="opt.icon || opt.svg"
          :icon="opt.icon"
          :src="opt.svg"
          class="icon"
          color="header"
        />
        <span v-clean-html="opt.label" />
      </li>

      <li
        v-if="!hasOptions(options)"
        class="no-actions"
      >
        <span v-t="'sortableTable.noActions'" />
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  .root {
    position: absolute;
  }

  .menu {
    position: absolute;
    visibility: hidden;
    top: 0;
    left: 0;
    z-index: z-index('dropdownContent');
    min-width: 145px;

    color: var(--dropdown-text);
    background-color: var(--dropdown-bg);
    border: 1px solid var(--dropdown-border);
    border-radius: 5px;
    box-shadow: 0 5px 20px var(--shadow);

    LI {
      align-items: center;
      display: flex;
      padding: 8px 10px;
      margin: 0;

      &:focus-visible {
        @include focus-outline;
        outline-offset: -2px;
      }

      &[disabled] {
        cursor: not-allowed  !important;
        color: var(--disabled-text);
      }

      &.divider {
        padding: 0;
        border-bottom: 1px solid var(--dropdown-divider);
      }

      &:not(.divider):hover {
        background-color: var(--dropdown-hover-bg);
        color: var(--dropdown-hover-text);
        cursor: pointer;
      }

      .icon {
        display: unset;
        width: 14px;
        text-align: center;
        margin-right: 8px;
      }

      &.no-actions {
        color: var(--disabled-text);
      }

      &.no-actions:hover {
        background-color: initial;
        color: var(--disabled-text);
        cursor: default;
      }
    }
  }

  .background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    z-index: z-index('dropdownOverlay');
  }
</style> -->
