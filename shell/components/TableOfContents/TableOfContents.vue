<script setup>
const props = defineProps({
  accordions: {
    type:     Array,
    required: true,
  }
});
</script>

<template>
  <div>
    <div class="toc-container">
      <h4>
        {{ t('cruResource.tableOfContents.jumpTo') }}
      </h4>
      <ul>
        <li
          v-for="(acc, i) in props.accordions"
          :key="i"
          :data-testid="`toc-list-item-${i}`"
        >
          <button
            v-if="acc.scrollTo"
            type="button"
            class="btn role-link accordion-link"
            @click="acc.scrollTo()"
          >
            {{ acc.label }}
          </button>
          <span v-else>{{ acc.label }}</span>
          <template v-if="acc?.children?.length">
            <ul data-testid="toc-list">
              <li
                v-for="(childAcc, j) in acc.children"
                :key="j"
                :data-testid="`toc-list-item-${i}-${j}`"
              >
                <button
                  v-if="childAcc.scrollTo"
                  type="button"
                  class="btn role-link accordion-link"
                  @click="childAcc.scrollTo()"
                >
                  {{ childAcc.label }}
                </button>
                <span v-else>{{ childAcc.label }}</span>
              </li>
            </ul>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  li:not(:last-child) {
    margin-bottom: var(--gap);
  }

  h4 {
    margin-bottom: 12px;
    margin-top: 0px
  }

  li ul {
    padding-left: var(--gap-md);
    & li {
      margin-top: var(--gap);
      margin-bottom: 0px;
    }
  }

  .toc-container {
    overflow-y: auto;
    padding: var(--gap-md);
    border-radius: var(--border-radius);
    background-color: var(--subtle-overlay-bg);
  }

  .accordion-link {
    padding: 0px;
    min-height: 0px;
    line-height: 1em;
  }
</style>
