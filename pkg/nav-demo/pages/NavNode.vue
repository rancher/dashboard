<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SimpleBox from '@shell/components/SimpleBox.vue';
import { ROUTE_PREFIX } from '../types';
import { useTranslation } from '../utils/i18n';

const t = useTranslation();
const route = useRoute();

/** Name of the nav entry this route was generated from, e.g. `l3-storage` */
const nodeName = computed(() => String(route.name ?? '').replace(ROUTE_PREFIX, ''));

/**
 * Declared depth, read back off the `lN-` prefix the nav entries in `index.ts` are named with.
 * Compare it with where the entry actually sits in the side menu.
 */
const declaredLevel = computed(() => Number(nodeName.value.match(/^l(\d)-/)?.[1] ?? 0));

const facts = computed(() => [
  { label: t('navDemo.node.declaredLevel'), value: declaredLevel.value ? `${ declaredLevel.value }` : '-' },
  { label: t('navDemo.node.navEntry'), value: nodeName.value },
  { label: t('navDemo.node.routeName'), value: String(route.name ?? '') },
  { label: t('navDemo.node.routePath'), value: route.path },
]);
</script>

<template>
  <div class="nav-node">
    <h1>{{ t('navDemo.node.title', { level: declaredLevel }) }}</h1>
    <p class="text-muted">
      {{ t('navDemo.node.subtitle') }}
    </p>

    <SimpleBox class="mt-20">
      <dl class="facts">
        <template
          v-for="fact in facts"
          :key="fact.label"
        >
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </template>
      </dl>
    </SimpleBox>
  </div>
</template>

<style lang="scss" scoped>
.facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 24px;
  margin: 0;

  dt {
    color: var(--input-label);
  }

  dd {
    margin: 0;
    font-family: monospace;
  }
}
</style>
