<script>
import LazyImage from '@/components/LazyImage';

export default {
  components: { LazyImage },

  props: {
    rows: {
      type:     Array,
      required: true,
    },

    keyField: {
      type:    String,
      default: 'key',
    },
    iconField: {
      type:    String,
      default: 'icon',
    },
    nameField: {
      type:    String,
      default: 'name',
    },
    descriptionField: {
      type:    String,
      default: 'description',
    },
    sideLabelField: {
      type:    String,
      default: 'sideLabel',
    },

    noDataKey: {
      type:    String,
      default: 'sortableTable.noRows',
    },

    colorFor: {
      type: Function,
      default() {
        return (r, idx) => `color${ (idx % 8) + 1 }`;
      },
    },
  },

  methods: {
    select(row, idx) {
      this.$emit('clicked', row, idx);
    }
  },
};
</script>

<template>
  <div v-if="rows.length" class="grid">
    <div
      v-for="(r, idx) in rows"
      :key="r[keyField]"
      class="item"
      :class="{'has-description': !!r[descriptionField], [colorFor(r, idx)]: true}"
      @click="select(r, idx)"
    >
      <div class="side-label">
        <label v-if="r[sideLabelField]">{{ r[sideLabelField] }}</label>
      </div>
      <div class="logo">
        <LazyImage :src="r[iconField]" />
      </div>
      <h4 class="name">
        {{ r[nameField] }}
      </h4>
      <div v-if="r[descriptionField]" class="description">
        {{ r[descriptionField] }}
      </div>
    </div>
  </div>
  <div v-else class="m-50 text-center">
    <h1 v-t="noDataKey" />
  </div>
</template>

<style lang="scss" scoped>
  $height: 110px;
  $side: 15px;
  $margin: 10px;
  $logo: 60px;

  .grid {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0 -1*$margin;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
      .item {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      .item {
        width: calc(50% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
      .item {
        width: calc(33.33333% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
      .item {
        width: calc(25% - 2 * #{$margin});
      }
    }

    .item {
      height: $height;
      margin: $margin;
      padding: $margin;
      position: relative;
      border-radius: calc( 1.5 * var(--border-radius));

      &:hover {
        box-shadow: 0 0 30px var(--shadow);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
      }

      .side-label {
        transform: rotate(180deg);
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        min-width: calc(1.5 * var(--border-radius));
        width: $side;
        border-top-right-radius: calc( 1.5 * var(--border-radius));
        border-bottom-right-radius: calc( 1.5 * var(--border-radius));

        label {
          text-align: center;
          writing-mode: tb;
          height: 100%;
          padding: 0 2px;
          display: block;
          white-space: no-wrap;
          text-overflow: ellipsis;
        }
      }

      .logo {
        text-align: center;
        position: absolute;
        left: $side+$margin;
        top: ($height - $logo)/2;
        width: $logo;
        height: $logo;
        border-radius: calc(2 * var(--border-radius));
        overflow: hidden;
        background-color: white;

        img {
          width: $logo - 4px;
          height: $logo - 4px;
          object-fit: contain;
          position: relative;
          top: 2px;
        }
      }

      .side-label {
        font-size: 10px;
      }

      &.rancher {
        background: var(--app-rancher-bg);

        .side-label {
          background-color: var(--app-rancher-accent);
          color: var(--app-rancher-accent-text);
        }
        &:hover {
          background: var(--app-rancher-accent);
        }
      }

      &.partner {
        background: var(--app-partner-bg);
        .side-label {
          background-color: var(--app-partner-accent);
          color: var(--app-partner-accent-text);
        }
        &:hover {
          background: var(--app-partner-accent);
        }
      }

      // @TODO figure out how to templatize these
      &.color1 {
        background: var(--app-color1-bg);
        .side-label { background-color: var(--app-color1-accent); color: var(--app-color1-accent-text); }
        &:hover { background: var(--app-color1-accent); }
      }
      &.color2 {
        background: var(--app-color2-bg);
        .side-label { background-color: var(--app-color2-accent); color: var(--app-color2-accent-text); }
        &:hover { background: var(--app-color2-accent); }
      }
      &.color3 {
        background: var(--app-color3-bg);
        .side-label { background-color: var(--app-color3-accent); color: var(--app-color3-accent-text); }
        &:hover { background: var(--app-color3-accent); }
      }
      &.color4 {
        background: var(--app-color4-bg);
        .side-label { background-color: var(--app-color4-accent); color: var(--app-color4-accent-text); }
        &:hover { background: var(--app-color4-accent); }
      }
      &.color5 {
        background: var(--app-color5-bg);
        .side-label { background-color: var(--app-color5-accent); color: var(--app-color5-accent-text); }
        &:hover { background: var(--app-color5-accent); }
      }
      &.color6 {
        background: var(--app-color6-bg);
        .side-label { background-color: var(--app-color6-accent); color: var(--app-color6-accent-text); }
        &:hover { background: var(--app-color6-accent); }
      }
      &.color7 {
        background: var(--app-color7-bg);
        .side-label { background-color: var(--app-color7-accent); color: var(--app-color7-accent-text); }
        &:hover { background: var(--app-color7-accent); }
      }
      &.color8 {
        background: var(--app-color8-bg);
        .side-label { background-color: var(--app-color8-accent); color: var(--app-color8-accent-text); }
        &:hover { background: var(--app-color8-accent); }
      }

      &:hover {
        background-position: right center;
      }

      .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: $height - (2 * $margin);
        margin: 0;
        margin-left: $side+$logo+$margin;
      }

      &.has-description .name {
        margin-top: $margin;
        line-height: initial;
      }

      .description {
        margin-top: $margin;
        margin-left: $side+$logo+$margin;
        margin-right: $margin;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-muted);
      }
    }
  }
</style>
