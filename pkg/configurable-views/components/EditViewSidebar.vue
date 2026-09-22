<script>
import CatalogTile from './CatalogTile.vue';
import { BUILDING_BLOCKS, READY_MADE, searchCatalog, blockName } from '../templating/widget-catalog';
import {
  NODE_WIDGET, WIDTH_PRESETS, HEIGHT_PRESETS, SPACING_PRESETS, COLUMN_SPANS,
  DEFAULT_GAP, DEFAULT_PAGE_PADDING, widthPresetOf, heightPresetOf, spacingPresetOf
} from '../templating/view-model';

// The "Edit view" drawer. Three tabs, and the split between them is the point:
//
//   ADD     what goes on the grid — building blocks (a shape, you say what it shows) and
//           ready-made widgets (the same shapes with their data already chosen).
//   LAYOUT  how the SELECTED widget sits — width, height, spacing, and exact pixels under Advanced.
//   VIEW    what is true of the WHOLE view — its name, its gap, whether it is your default.
//
// Everything is emitted; the drawer holds only its own tab, search box and Advanced toggle.
export default {
  name:       'EditViewSidebar',
  components: { CatalogTile },

  props: {
    // The view being edited (a panel).
    view: {
      type:    Object,
      default: null,
    },
    // The node the Layout tab acts on (null when nothing is selected).
    selected: {
      type:    Object,
      default: null,
    },
    isDefault: {
      type:    Boolean,
      default: false,
    },
    // A view that has never been saved shows its starting points instead of jumping straight to
    // the catalog — the first decision is what it should be ABOUT.
    isNew: {
      type:    Boolean,
      default: false,
    },
    startedFrom: {
      type:    String,
      default: '',
    },
    startingPoints: {
      type:    Array,
      default: () => [],
    },
    // Rancher's own Home, kept as a view. There is no grid behind it, so there is nothing to add
    // to it and nothing to lay out.
    isStock: {
      type:    Boolean,
      default: false,
    },
  },

  emits: [
    'close', 'add', 'drag-start', 'drag-end', 'set-width', 'set-height', 'set-spacing',
    'set-box', 'set-col-span', 'set-gap', 'set-name', 'set-default', 'publish', 'delete',
    'start-from', 'advanced', 'set-page-padding'
  ],

  data() {
    return {
      tab:          'add',
      search:       '',
      advancedOpen: false,
      widths:       WIDTH_PRESETS,
      heights:      HEIGHT_PRESETS,
      spacings:     SPACING_PRESETS,
      columnSpans:  COLUMN_SPANS,
      sides:        ['top', 'right', 'bottom', 'left'],
    };
  },

  computed: {
    blocks() {
      return searchCatalog(BUILDING_BLOCKS, this.search);
    },

    readyMade() {
      return searchCatalog(READY_MADE, this.search);
    },

    gap() {
      return this.view?.gap ?? DEFAULT_GAP;
    },

    pagePadding() {
      return this.view?.pad ?? DEFAULT_PAGE_PADDING;
    },

    // "Selected: Clusters (Table)" — the widget's own title, then which building block it is.
    selectedLabel() {
      if (!this.selected) {
        return '';
      }
      if (this.selected.type !== NODE_WIDGET) {
        return `${ this.selected.template } (Template)`;
      }

      const widget = this.selected.widget;

      return `${ widget.title || blockName(widget.kind) } (${ blockName(widget.kind) })`;
    },

    widthPreset() {
      return this.selected ? widthPresetOf(this.selected.colSpan) : null;
    },

    heightPreset() {
      return this.selected ? heightPresetOf(this.selected.height, this.gap) : null;
    },

    spacingPreset() {
      return this.selected ? spacingPresetOf(this.selected.padding) : null;
    },
  },

  methods: {
    // The canvas draws the margin/padding bands while this is open, so the numbers being typed
    // have something to point at.
    toggleAdvanced() {
      this.advancedOpen = !this.advancedOpen;
      this.$emit('advanced', this.advancedOpen);
    },

    sideLabel(side) {
      return side.charAt(0).toUpperCase() + side.slice(1);
    },
  },
};
</script>

<template>
  <aside class="evs">
    <header class="evs__head">
      <h3 class="evs__title">
        Edit panel<template v-if="view">
          &nbsp;-&nbsp; {{ view.name }}
        </template>
      </h3>
      <button
        class="evs__close"
        title="Close"
        aria-label="Close the editor"
        @click="$emit('close')"
      >
        <i class="icon icon-close" />
      </button>
    </header>

    <nav class="evs__tabs">
      <button
        v-for="t in [{ id: 'add', label: 'Add' }, { id: 'layout', label: 'Layout' }, { id: 'view', label: 'Panel' }]"
        :key="t.id"
        class="evs__tab"
        :class="{ 'evs__tab--active': tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <div
      class="evs__body"
      :class="{ 'evs__body--layout': tab === 'layout' }"
    >
      <!-- A stock view is Rancher's own Home with no grid behind it: nothing to add, nothing to
         lay out. Its View tab still works — it can be named, defaulted and deleted like any other. -->
      <p
        v-if="isStock && tab !== 'view'"
        class="evs__hint"
      >
        This panel is Rancher's own Home. It has no grid, so there is nothing to add to it or lay
        out. Rename it in the header, or make a new panel to build one of your own.
      </p>

      <!-- ---- ADD ---- -->
      <template v-else-if="tab === 'add'">
        <!-- A brand-new view: name it, drag things in, or start it from something that exists. -->
        <section
          v-if="isNew"
          class="evs__new"
        >
          <h4 class="evs__new-title">
            <template v-if="startedFrom">
              New panel, started from {{ startedFrom }}
            </template>
            <template v-else>
              New panel
            </template>
          </h4>
          <p class="evs__hint">
            Name it in the header. Drag widgets in, or change the starting point:
          </p>
          <div class="evs__chips">
            <button
              class="evs__chip"
              @click="$emit('start-from', '')"
            >
              Start empty instead
            </button>
            <button
              v-for="point in startingPoints"
              :key="point.id"
              class="evs__chip"
              @click="$emit('start-from', point.id)"
            >
              {{ point.label }}
            </button>
          </div>
          <p class="evs__hint">
            Nothing is saved until you press Save. Cancel throws the new panel away.
          </p>
        </section>

        <input
          v-model="search"
          class="evs__field"
          placeholder="Search components"
          aria-label="Search components"
        >

        <p class="evs__hint">
          Drag onto the grid. Building blocks ask what to show once placed; ready-made widgets come
          with their data set.
        </p>

        <h4 class="evs__group">
          Building blocks
        </h4>
        <p class="evs__hint">
          Any resource, including your own CRDs.
        </p>
        <div class="evs__tiles">
          <CatalogTile
            v-for="entry in blocks"
            :key="entry.id"
            :entry="entry"
            @dragstart="(e, ev) => $emit('drag-start', e, ev)"
            @dragend="$emit('drag-end')"
            @add="$emit('add', $event)"
          />
          <p
            v-if="!blocks.length"
            class="evs__hint"
          >
            No building block matches “{{ search }}”.
          </p>
        </div>

        <h4 class="evs__group">
          Ready-made
        </h4>
        <p class="evs__hint">
          Building blocks with their data already set. Save your own from any widget.
        </p>
        <div class="evs__tiles">
          <CatalogTile
            v-for="entry in readyMade"
            :key="entry.id"
            :entry="entry"
            @dragstart="(e, ev) => $emit('drag-start', e, ev)"
            @dragend="$emit('drag-end')"
            @add="$emit('add', $event)"
          />
          <p
            v-if="!readyMade.length"
            class="evs__hint"
          >
            No ready-made widget matches “{{ search }}”.
          </p>
        </div>
      </template>

      <!-- ---- LAYOUT ---- -->
      <template v-else-if="tab === 'layout'">
        <p
          v-if="selected"
          class="evs__selected"
        >
          Selected: {{ selectedLabel }}
        </p>
        <p class="evs__hint">
          Click a widget on the grid to lay it out. Width, height and spacing are per widget; the
          grid gap is the same for the whole panel.
        </p>

        <template v-if="selected">
          <div class="evs__control">
            <h4 class="evs__label">
              Width
            </h4>
            <div class="evs__seg">
              <button
                v-for="w in widths"
                :key="w.id"
                class="evs__pill"
                :class="{ 'evs__pill--on': widthPreset === w.id }"
                @click="$emit('set-width', w.span)"
              >
                {{ w.label }}
              </button>
            </div>
          </div>

          <div class="evs__control">
            <h4 class="evs__label">
              Height
            </h4>
            <div class="evs__seg">
              <button
                v-for="h in heights"
                :key="h.id"
                class="evs__pill"
                :class="{ 'evs__pill--on': heightPreset === h.id }"
                @click="$emit('set-height', h.id)"
              >
                {{ h.label }}
              </button>
            </div>
          </div>

          <div class="evs__control">
            <h4 class="evs__label">
              Spacing
            </h4>
            <div class="evs__seg">
              <button
                v-for="s in spacings"
                :key="s.id"
                class="evs__pill"
                :class="{ 'evs__pill--on': spacingPreset === s.id }"
                @click="$emit('set-spacing', s.id)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <button
            class="evs__advanced"
            :aria-expanded="advancedOpen ? 'true' : 'false'"
            @click="toggleAdvanced"
          >
            <i
              class="icon"
              :class="advancedOpen ? 'icon-chevron-down' : 'icon-chevron-right'"
            />
            Advanced
          </button>

          <template v-if="advancedOpen">
            <p class="evs__hint">
              Exact values in pixels. Overrides the Spacing preset for this component only.
            </p>

            <div class="evs__control">
              <h4 class="evs__label evs__label--margin">
                Margin
              </h4>
              <div class="evs__sides">
                <label
                  v-for="side in sides"
                  :key="`m-${ side }`"
                >
                  <input
                    class="evs__field evs__field--num"
                    type="number"
                    :value="selected.margin[side]"
                    @change="$emit('set-box', 'margin', side, $event.target.value)"
                  >
                  <span>{{ sideLabel(side) }}</span>
                </label>
              </div>
            </div>

            <div class="evs__control">
              <h4 class="evs__label evs__label--padding">
                Padding
              </h4>
              <div class="evs__sides">
                <label
                  v-for="side in sides"
                  :key="`p-${ side }`"
                >
                  <input
                    class="evs__field evs__field--num"
                    type="number"
                    :value="selected.padding[side]"
                    @change="$emit('set-box', 'padding', side, $event.target.value)"
                  >
                  <span>{{ sideLabel(side) }}</span>
                </label>
              </div>
            </div>

            <div class="evs__control">
              <h4 class="evs__label">
                Column span
              </h4>
              <div class="evs__seg">
                <button
                  v-for="span in columnSpans"
                  :key="span"
                  class="evs__pill evs__pill--narrow"
                  :class="{ 'evs__pill--on': selected.colSpan === span }"
                  @click="$emit('set-col-span', span)"
                >
                  {{ span }}
                </button>
              </div>
            </div>
          </template>
        </template>
      </template>

      <!-- ---- VIEW ---- -->
      <template v-else>
        <p class="evs__hint">
          These apply to the whole panel — every widget on it.
        </p>

        <h4 class="evs__group">
          Name
        </h4>
        <input
          class="evs__field"
          :value="view ? view.name : ''"
          aria-label="Panel name"
          @input="$emit('set-name', $event.target.value)"
        >

        <h4
          v-if="!isStock"
          class="evs__group"
        >
          Grid gap
        </h4>
        <div
          v-if="!isStock"
          class="evs__row"
        >
          <input
            class="evs__field evs__field--num"
            type="number"
            min="0"
            max="64"
            :value="gap"
            aria-label="Grid gap in pixels"
            @change="$emit('set-gap', $event.target.value)"
          >
          <span class="evs__hint">pixels between widgets</span>
        </div>

        <h4
          v-if="!isStock"
          class="evs__group"
        >
          Page padding
        </h4>
        <div
          v-if="!isStock"
          class="evs__row"
        >
          <input
            class="evs__field evs__field--num"
            type="number"
            min="0"
            max="96"
            :value="pagePadding"
            aria-label="Page padding in pixels"
            @change="$emit('set-page-padding', $event.target.value)"
          >
          <span class="evs__hint">pixels around the whole grid</span>
        </div>

        <h4 class="evs__group">
          This panel
        </h4>
        <button
          class="btn btn-sm role-secondary evs__wide"
          :disabled="isDefault"
          @click="$emit('set-default')"
        >
          {{ isDefault ? 'This is my default panel' : 'Set as my default' }}
        </button>
        <button
          class="btn btn-sm role-secondary evs__wide"
          @click="$emit('publish')"
        >
          Publish as organization template
        </button>
        <button
          class="btn btn-sm role-link evs__wide evs__danger"
          @click="$emit('delete')"
        >
          Delete panel
        </button>
      </template>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
// 380px wide, its own scroll — the grid beside it keeps the width it will really have. It starts
// below the view bar, which spans the whole page above both of them.
.evs {
  background:     var(--body-bg);
  border-left:    1px solid var(--border);
  box-sizing:     border-box;
  display:        flex;
  flex:           0 0 380px;
  flex-direction: column;
  // Below the view bar, which is sticky at 0 and spans the page above both of us. At top:0 this
  // rode up over the bar the moment the page scrolled.
  height:         calc(100vh - var(--header-height, 54px) - 57px);
  position:       sticky;
  top:            57px;
  width:          380px;
  // Above the view bar, below the app header's stacking context (see the note at the foot of this
  // file) — the drawer is page chrome and must never cover the header's menus.
  z-index:        9;

  &__head {
    align-items:     center;
    box-sizing:      border-box;
    display:         flex;
    flex:            0 0 auto;
    height:          56px;
    justify-content: space-between;
    padding:         0 16px;
  }

  &__title {
    font-size:     16px;
    font-weight:   600;
    margin:        0;
    overflow:      hidden;
    text-overflow: ellipsis;
    white-space:   nowrap;
  }

  &__close {
    background:  transparent;
    border:      none;
    color:       var(--muted);
    cursor:      pointer;
    font-size:   16px;
    line-height: 1;
    min-height:  0;
    padding:     4px;

    &:hover {
      color: var(--link);
    }
  }

  // A 25px strip: 12px labels, 16px apart, the active one underlined ON the strip's own hairline.
  &__tabs {
    border-bottom: 1px solid var(--border);
    box-sizing:    border-box;
    display:       flex;
    flex:          0 0 auto;
    gap:           16px;
    height:        25px;
    padding:       0 16px;
  }

  // The active tab's underline sits ON the row's own hairline, not under it — otherwise the two
  // draw as separate lines a few pixels apart. The active tab darkens rather than bolding: the
  // underline already carries the state, and reflowing the label on every click does not.
  &__tab {
    background:    transparent;
    border:        none;
    border-bottom: 2px solid transparent;
    color:         var(--link);
    cursor:        pointer;
    font-size:     12px;
    line-height:   17px;
    margin-bottom: -1px;
    min-height:    0;
    padding:       0 0 5px;

    &--active {
      border-bottom-color: var(--primary);
      color:               var(--primary);
    }
  }

  &__body {
    display:        flex;
    flex:           1 1 auto;
    flex-direction: column;
    gap:            10px;
    overflow-y:     auto;
    padding:        16px;

    // The Layout tab is a list of controls rather than prose, and the design gives it more air.
    &--layout {
      gap: 14px;
    }

    // A column flex container shrinks its items before it overflows, which silently squashed every
    // fixed-height control in here (a 32px input rendered at 19px). Nothing in this list shrinks.
    > * {
      flex: 0 0 auto;
    }
  }

  &__hint {
    color:       var(--muted);
    font-size:   12px;
    line-height: 1.35;
    margin:      0;
  }

  // A SECTION heading in the Add tab ("Building blocks", "Ready-made", "Advanced").
  &__group {
    font-size:   13px;
    font-weight: 700;
    margin:      0;
  }

  // The label above one control in the Layout tab. Quieter than a section heading — it names a
  // setting, it does not open a part of the drawer.
  &__label {
    color:         var(--muted);
    font-size:     12px;
    font-weight:   700;
    line-height:   14px;
    margin:        0 0 6px;

    // Colour-keyed to the bands drawn on the canvas: amber = margin, teal = padding.
    &--margin,
    &--padding {
      align-items: center;
      display:     flex;
      gap:         6px;

      &::before {
        border-radius: 2px;
        content:       '';
        height:        9px;
        width:         9px;
      }
    }

    &--margin::before {
      background: rgba(247, 181, 0, 0.9);
    }

    &--padding::before {
      background: rgba(0, 170, 90, 0.9);
    }
  }

  &__selected {
    background:    var(--accent-btn);
    border-radius: 4px;
    font-size:     14px;
    line-height:   18px;
    margin:        0;
    padding:       8px 10px;
  }

  &__field {
    background:    var(--body-bg);
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    box-sizing:    border-box;
    color:         var(--body-text);
    font-size:     14px;
    height:        32px;
    padding:       0 10px;
    width:         100%;

    &--num {
      text-align: center;
      width:      100%;
    }
  }

  &__tiles {
    display:        flex;
    flex-direction: column;
    gap:            6px;
  }

  // One setting: its label, then the control. The 6px between them comes from the label's own
  // margin, so it stays independent of the gap BETWEEN settings.
  &__control {
    display:        flex;
    flex-direction: column;
  }

  // A SEGMENTED CONTROL: one track, the options a pixel apart inside it, exactly one filled. Same
  // component as the view tabs in the bar, one size down.
  &__seg {
    align-items:   center;
    align-self:    flex-start;
    background:    var(--default);
    border-radius: 4px;
    display:       flex;
    gap:           1px;
    max-width:     100%;
    overflow:      hidden;
  }

  &__pill {
    background:    transparent;
    border:        none;
    border-radius: 4px;
    color:         var(--body-text);
    cursor:        pointer;
    font-size:     12px;
    // Said explicitly: the shell's global button rule is 40px tall, a segment here is 24.
    height:        24px;
    line-height:   24px;
    min-height:    24px;
    padding:       0 8px;
    white-space:   nowrap;

    &:hover:not(&--on) {
      background: var(--accent-btn);
    }

    &--on {
      background: var(--primary);
      color:      var(--primary-text);
    }

    &--narrow {
      min-width: 24px;
    }
  }

  // Advanced opens a further set of controls, so it is separated by a rule and titled like the
  // Add tab's section headings.
  &__advanced {
    align-items:  center;
    background:   transparent;
    border:       none;
    border-top:   1px solid var(--border);
    color:        var(--body-text);
    cursor:       pointer;
    display:      flex;
    font-size:    13px;
    font-weight:  700;
    gap:          8px;
    line-height:  16px;
    min-height:   0;
    padding:      12px 0 0;
    width:        100%;

    i {
      font-size: 16px;
    }
  }

  &__sides {
    display:               grid;
    gap:                   8px;
    grid-template-columns: repeat(4, minmax(0, 1fr));

    label {
      display:        flex;
      flex-direction: column;
      gap:            3px;
    }

    span {
      color:       var(--muted);
      font-size:   12px;
      line-height: 12px;
      text-align:  center;
    }
  }

  &__row {
    align-items: center;
    display:     flex;
    gap:         8px;

    .evs__field--num {
      width: 72px;
    }
  }

  &__wide {
    width: 100%;
  }

  // ---- the new-view card ----
  // The design's own numbers: a 4px card, 12px inside it, 8px between its parts, and it sits in the
  // body's 10px rhythm like everything else rather than carrying a margin of its own.
  &__new {
    background:     var(--body-bg);
    border:         1px solid var(--border);
    border-radius:  4px;
    display:        flex;
    flex-direction: column;
    gap:            8px;
    padding:        12px;
  }

  &__new-title {
    font-size:   14px;
    font-weight: 700;
    line-height: 17px;
    margin:      0;
  }

  &__chips {
    display:   flex;
    flex-wrap: wrap;
    gap:       6px;
  }

  // A 24px pill: 12px label, 4/10 inside, the drawer's own hairline round it. The shell's global
  // .btn rule is why the height is stated three ways.
  &__chip {
    background:    transparent;
    border:        1px solid var(--border);
    border-radius: 12px;
    box-sizing:    border-box;
    color:         var(--link);
    cursor:        pointer;
    font-size:     12px;
    height:        24px;
    line-height:   14px;
    min-height:    24px;
    padding:       4px 10px;

    &:hover {
      border-color: var(--primary);
    }
  }

  &__danger {
    color: var(--error);
  }
}

// The shell's app header is a stacking context at z-index 14, and the user menu, the notification
// tray and every other header dropdown live INSIDE it. So anything on the page at 14 or above does
// not merely sit beside them — it covers the whole header, menus and all. Page chrome stays below
// that ceiling; it only ever needs to beat the page, never the app.
</style>
