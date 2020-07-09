<script>
import Tag from '@/components/Tag';
import { isEmpty } from 'lodash';

export default {
  components: { Tag },
  props:      {
    description: {
      type:    String,
      default: ''
    },
    labels: {
      type:    Object,
      default: () => ({})
    },
    annotations: {
      type:    Object,
      default: () => ({})
    },
    details: {
      type:    Array,
      default: () => []
    }
  },
  data() {
    return { annotationsVisible: false };
  },
  computed: {
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
    isEmpty() {
      const hasAnything = this.hasDetails || this.hasLabels || this.hasAnnotations || this.hasDescription;

      return !hasAnything;
    },
    rightColumnSpan() {
      return this.hasDetails ? 'span-10' : 'span-12';
    }
  },
  methods: {
    showAnnotations() {
      this.annotationsVisible = true;
    }
  }
};
</script>

<template>
  <div class="detail-top row" :class="{empty: isEmpty}">
    <div v-if="hasDetails" class="col left span-2">
      <div v-for="detail in details" :key="detail.label || detail.slotName">
        <label>{{ detail.label }}:</label>
        <span v-if="detail.formatter">
          <component
            :is="detail.formatter"
            :value="detail.content"
            v-bind="detail.formatterOpts"
          />
        </span>
        <span v-else>{{ detail.content }}</span>
      </div>
    </div>
    <div class="col right" :class="rightColumnSpan">
      <div v-if="description" class="description">
        <label>{{ t('resourceDetail.detailTop.description') }}:</label> <span class="content">{{ description }}</span>
      </div>
      <div v-if="hasLabels" class="labels">
        <label>{{ t('resourceDetail.detailTop.labels') }}:</label>
        <div class="tags">
          <Tag v-for="(value, key) in labels" :key="key + value">
            {{ key }}<span v-if="value">: </span>{{ value }}
          </Tag>
        </div>
      </div>
      <div v-if="hasAnnotations" class="annotations">
        <label>{{ t('resourceDetail.detailTop.annotations') }}:</label>
        <a v-if="!annotationsVisible" href="#" @click="showAnnotations">{{ t('resourceDetail.detailTop.showAnnotations', {annotations: annotationCount}) }}</a>
        <table v-else>
          <tbody>
            <tr v-for="(value, key) in annotations" :key="key + value">
              <td>
                {{ key }}
              </td>
              <td>
                {{ value }}
              </td>
            </tr>
          </tbody>
        </table>
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

    label {
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
  }
</style>
