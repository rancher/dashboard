<script>
import Tag from '@/components/Tag';
import { isEmpty } from 'lodash';
import KeyValue from '@/components/form/KeyValue';
import { _VIEW } from '@/config/query-params';

export default {
  components: { KeyValue, Tag },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return { annotationsVisible: false, view: _VIEW };
  },

  computed: {
    details() {
      return this.value?.details;
    },
    labels() {
      return this.value?.labels || {};
    },

    annotations() {
      return this.value?.annotations || {};
    },

    description() {
      return this.value?.description;
    },

    hasDetails() {
      return !isEmpty(this.details);
    },

    hasLabels() {
      return !isEmpty(this.labels);
    },

    hasAnnotations() {
      return !isEmpty(this.annotations);
    },

    hasDescription() {
      return !isEmpty(this.description);
    },

    annotationCount() {
      return Object.keys(this.annotations || {}).length;
    },

    hasLeft() {
      return this.hasDetails;
    },

    hasRight() {
      return this.hasLabels || this.hasAnnotations || this.hasDescription;
    },

    isEmpty() {
      const hasAnything = this.hasDetails || this.hasLabels || this.hasAnnotations || this.hasDescription;

      return !hasAnything;
    },

    leftSpan() {
      if ( this.hasRight ) {
        return 'span-3';
      }

      return 'span-12';
    },

    rightSpan() {
      if ( this.hasLeft ) {
        return 'span-9';
      } else {
        return 'span-12';
      }
    }
  },
  methods: {
    showAnnotations(ev) {
      ev.preventDefault();
      this.annotationsVisible = true;
    }
  }
};
</script>

<template>
  <div class="detail-top row" :class="{empty: isEmpty}">
    <div v-if="hasLeft" class="col left" :class="leftSpan">
      <div v-for="detail in details" :key="detail.label || detail.slotName">
        <span class="label">
          {{ detail.label }}:
        </span>
        <component
          :is="detail.formatter"
          v-if="detail.formatter"
          :value="detail.content"
          v-bind="detail.formatterOpts"
        />
        <span v-else>{{ detail.content }}</span>
      </div>
    </div>
    <div v-if="hasRight" class="col right" :class="rightSpan">
      <div v-if="description" class="description">
        <span class="label">
          {{ t('resourceDetail.detailTop.description') }}:
        </span>
        <span class="content">{{ description }}</span>
      </div>
      <div v-if="hasLabels" class="labels">
        <span class="label">
          {{ t('resourceDetail.detailTop.labels') }}:
        </span>
        <div class="tags">
          <Tag v-for="(prop, key) in labels" :key="key + prop">
            {{ key }}<span v-if="prop">: </span>{{ prop }}
          </Tag>
        </div>
      </div>
      <div v-if="hasAnnotations" class="annotations">
        <span class="label">
          {{ t('resourceDetail.detailTop.annotations') }}:
        </span>
        <a v-if="!annotationsVisible" href="#" @click="showAnnotations">{{ t('resourceDetail.detailTop.showAnnotations', {annotations: annotationCount}) }}</a>
        <KeyValue v-else :value="annotations" :mode="view" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .detail-top {
    $left-column-spacing: 5px;
    $right-column-spacing: 10px;
    $border: 1px solid var(--tabbed-border);
    border-top: $border;

    &:not(.empty) {
      border-bottom: $border;
      padding: 15px 0;
    }

    .tags {
      display: inline-flex;
      flex-direction: row;
      flex-wrap: wrap;

      .tag {
        margin: -3px $right-column-spacing $right-column-spacing 0;
      }
    }

    .description {
      margin-bottom: $right-column-spacing;
    }

    .label {
      color: var(--input-label);
      margin: 0 4px 0 0;
    }

    .col.right > * {
      display: flex;
      flex-direction: row;
    }

    .col.left > *:not(:last-child) {
      margin-bottom: $left-column-spacing;
    }

    table tr td:first-of-type {
      padding-right: 60px;
    }

    .key-value .kv-row {
      grid-template-columns: 33.333% 1fr;
    }
  }
</style>
