<script>
import Tag from '@shell/components/Tag';
import isEmpty from 'lodash/isEmpty';
import DetailText from '@shell/components/DetailText';
import { _VIEW } from '@shell/config/query-params';

export const SEPARATOR = { separator: true };

export default {
  components: { DetailText, Tag },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    moreDetails: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return {
      annotationsVisible: false,
      showAllLabels:      false,
      view:               _VIEW
    };
  },

  computed: {
    namespaces() {
      return (this.value?.namespaces || []).map((namespace) => {
        return {
          name:           namespace?.metadata?.name,
          detailLocation: namespace.detailLocation
        };
      });
    },
    details() {
      const items = [
        ...(this.moreDetails || []),
        ...(this.value?.details || []),
      ].filter(x => x.separator || (!!`${ x.content }` && x.content !== undefined && x.content !== null));

      const groups = [];
      let currentGroup = [];

      items.forEach((i) => {
        if (i.separator) {
          groups.push(currentGroup);
          currentGroup = [];
        } else {
          currentGroup.push(i);
        }
      });

      if (currentGroup.length) {
        groups.push(currentGroup);
      }

      return groups;
    },

    labels() {
      if (this.showAllLabels || !this.showFilteredSystemLabels) {
        return this.value?.labels || {};
      }

      return this.value?.filteredSystemLabels;
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

    hasNamespaces() {
      return !isEmpty(this.namespaces);
    },

    annotationCount() {
      return Object.keys(this.annotations || {}).length;
    },

    isEmpty() {
      const hasAnything = this.hasDetails || this.hasLabels || this.hasAnnotations || this.hasDescription || this.hasNamespaces;

      return !hasAnything;
    },

    showFilteredSystemLabels() {
      return !!this.value.filteredSystemLabels;
    },
  },
  methods: {
    toggleLabels() {
      this.showAllLabels = !this.showAllLabels;
    },

    toggleAnnotations(ev) {
      this.annotationsVisible = !this.annotationsVisible;
    }
  }
};
</script>

<template>
  <div
    class="detail-top"
    :class="{empty: isEmpty}"
  >
    <div
      v-if="hasNamespaces"
      class="labels"
    >
      <span class="label">
        {{ t('resourceDetail.detailTop.namespaces') }}:
      </span>
      <span>
        <nuxt-link
          v-for="namespace in namespaces"
          :key="namespace.name"
          :to="namespace.detailLocation"
          class="namespaceLinkList"
        >
          {{ namespace.name }}
        </nuxt-link>
      </span>
    </div>

    <div
      v-if="description"
      class="description"
    >
      <span class="label">
        {{ t('resourceDetail.detailTop.description') }}:
      </span>
      <span class="content">{{ description }}</span>
    </div>

    <div v-if="hasDetails">
      <div
        v-for="group, index in details"
        :key="index"
        class="details"
      >
        <div
          v-for="detail in group"
          :key="detail.label || detail.slotName"
          class="detail"
        >
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
    </div>

    <div
      v-if="hasLabels"
      class="labels"
    >
      <div class="tags">
        <span class="label">
          {{ t('resourceDetail.detailTop.labels') }}:
        </span>
        <Tag
          v-for="(prop, key) in labels"
          :key="key + prop"
        >
          {{ key }}<span v-if="prop">: </span>{{ prop }}
        </Tag>
        <a
          v-if="showFilteredSystemLabels"
          href="#"
          class="detail-top__label-button"
          @click.prevent="toggleLabels"
        >
          {{ t(`resourceDetail.detailTop.${showAllLabels? 'hideLabels' : 'showLabels'}`) }}
        </a>
      </div>
    </div>

    <div
      v-if="hasAnnotations"
      class="annotations"
    >
      <span class="label">
        {{ t('resourceDetail.detailTop.annotations') }}:
      </span>
      <a
        href="#"
        @click.prevent="toggleAnnotations"
      >
        {{ t(`resourceDetail.detailTop.${annotationsVisible? 'hideAnnotations' : 'showAnnotations'}`, {annotations: annotationCount}) }}
      </a>
      <div v-if="annotationsVisible">
        <DetailText
          v-for="(val, key) in annotations"
          :key="key"
          class="annotation"
          :value="val"
          :label="key"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .detail-top {
    $spacing: 4px;

    &:not(.empty) {
      // Flip of .masthead padding/margin
      padding-top: 10px;
      border-top: 1px solid var(--border);
      margin-top: 10px;
    }

    .namespaceLinkList:not(:first-child):before {
      content: ", ";
    }

    .tags {
      display: inline-flex;
      flex-direction: row;
      flex-wrap: wrap;
      position: relative;
      top: $spacing * math.div(-1, 2);

      .label {
        position: relative;
        top: $spacing;
      }

      .tag {
        margin: math.div($spacing, 2) $spacing 0 math.div($spacing, 2);
        font-size: 12px;
      }
    }

    .annotation {
      margin-top: 10px;
    }

    .label {
      color: var(--input-label);
      margin: 0 4px 0 0;
    }

    &__label-button {
      padding: 4px;
    }

    .details {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;

      .detail {
        margin-right: 20px;
        margin-bottom: 3px;
      }
      &:not(:first-of-type) {
        margin-top: 3px;
      }
    }

    & > div {
      &:not(:last-of-type) {
        margin-bottom: $spacing;
      }
    }
  }
</style>
