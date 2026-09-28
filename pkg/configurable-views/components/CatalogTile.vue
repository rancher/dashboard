<script setup lang="ts">
import type { CatalogEntry } from '../templating/widget-catalog';

// One row of the Add tab's catalog: a drag handle, a small picture of what the component looks
// like, its name and one line saying what it is for.
//
// The picture is drawn inline rather than loaded as an asset — the tiny SVGs weigh nothing, ship
// with the package, and follow the theme's colours, which an image could not.

defineProps<{ entry: CatalogEntry }>();

defineEmits<{ dragstart: [entry: CatalogEntry, event: DragEvent]; dragend: []; add: [entry: CatalogEntry] }>();
</script>

<template>
  <div
    class="ctile"
    draggable="true"
    :title="`Drag ${ entry.name } onto the grid, or click to add it`"
    @dragstart="$emit('dragstart', entry, $event)"
    @dragend="$emit('dragend')"
    @click="$emit('add', entry)"
  >
    <i class="icon icon-menu ctile__grip" />

    <span class="ctile__thumb">
      <svg
        class="ctile__pic"
        viewBox="0 0 56 40"
        aria-hidden="true"
      >
        <template v-if="entry.icon === 'table'">
          <rect
            class="ctile__strong"
            x="0"
            y="4"
            width="56"
            height="5"
            rx="1"
          />
          <rect
            v-for="y in [14, 21, 28]"
            :key="y"
            class="ctile__soft"
            x="0"
            :y="y"
            width="56"
            height="4"
            rx="1"
          />
        </template>

        <template v-else-if="entry.icon === 'banner'">
          <rect
            class="ctile__strong"
            x="0"
            y="6"
            width="56"
            height="28"
            rx="2"
          />
        </template>

        <template v-else>
          <rect
            v-for="y in [8, 17, 26]"
            :key="y"
            class="ctile__strong"
            x="0"
            :y="y"
            :width="y === 26 ? 30 : 44"
            height="5"
            rx="1"
          />
        </template>
      </svg>
    </span>

    <div class="ctile__text">
      <span class="ctile__name">{{ entry.name }}</span>
      <span class="ctile__desc">{{ entry.desc }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// The design draws a catalog tile with a DASHED edge — the same dashed language the grid uses for
// something you are about to place — and the little picture in its own framed swatch.
.ctile {
  align-items:   center;
  background:    var(--body-bg);
  border:        1px dashed var(--border);
  border-radius: 4px;
  cursor:        grab;
  display:       flex;
  gap:           10px;
  padding:       8px 12px 8px 8px;

  &:hover {
    border-color: var(--primary);
  }

  &:active {
    cursor: grabbing;
  }

  &__grip {
    color:     var(--body-text);
    flex:      0 0 auto;
    font-size: 16px;
  }

  &__thumb {
    background:    var(--sortable-table-header-bg, var(--box-bg));
    border:        1px solid var(--border);
    border-radius: 3px;
    box-sizing:    border-box;
    display:       block;
    flex:          0 0 56px;
    height:        40px;
    padding:       5px;
    width:         56px;
  }

  &__pic {
    display: block;
    height:  100%;
    width:   100%;
  }

  &__strong {
    fill: var(--primary);
  }

  &__soft {
    fill: var(--border);
  }

  &__ok {
    fill: var(--success);
  }

  &__warn {
    fill: var(--warning);
  }

  &__bad {
    fill: var(--error);
  }

  &__text {
    display:        flex;
    flex-direction: column;
    gap:            2px;
    min-width:      0;
  }

  &__name {
    font-size: 14px;
  }

  &__desc {
    color:       var(--muted);
    font-size:   12px;
    line-height: 1.17;
  }
}
</style>
