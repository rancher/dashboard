<script setup>
import { defineProps } from 'vue';

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
          v-for="acc, i in props.accordions"
          :key="i"
        >
          <a
            v-if="acc.scrollTo"
            @click="acc.scrollTo()"
          > {{ acc.label }}</a>
          <span v-else>{{ acc.label }}</span>
          <template v-if="acc?.children?.length">
            <ul>
              <li
                v-for="childAcc, j in acc.children"
                :key="j"
              >
                <!-- TODO nb add aria attribute -->
                <a
                  v-if="childAcc.scrollTo"
                  @click="childAcc.scrollTo()"
                > {{ childAcc.label }}</a>
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
    max-height: calc(100vh - var(--footer-height) - 260px); //TODO nb do the right way
    position: sticky;
    top: 24px;
    padding: var(--gap-md);
    border-radius: var(--border-radius);
    background-color: var(--subtle-overlay-bg ); //TODO nb confirm which var to use here
  }
</style>
