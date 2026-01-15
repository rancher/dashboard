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
          <a @click="acc.scrollTo"> {{ acc.title }}</a>
          <template v-if="acc?.children?.length">
            <ul>
              <li
                v-for="childAcc, j in acc.children"
                :key="j"
              >
                <!-- TODO nb add aria attribute -->
                <a @click="acc.scrollTo(); childAcc.scrollTo()"> {{ childAcc.title }}</a>
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
    position: sticky;
    top: 0;
    padding: var(--gap-md);
    border-radius: var(--border-radius);
    background-color: var(--subtle-overlay-bg ); //TODO nb confirm which var to use here
  }
</style>
