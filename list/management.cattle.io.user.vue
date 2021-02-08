<script>
import ResourceList from '@/components/ResourceList';
// import AsyncButton from '@/components/AsyncButton';

export default {
  // components: { AsyncButton },
  mixins:     [
    ResourceList
  ]
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
    >
      <template slot="extraActions">
        <!-- Specific 'Refresh group memberships' and create with custom 'Add User' text buttons will go here -->
        <!-- <AsyncButton />
        <n-link
          :to="''"
          class="btn role-primary"
        >
          Test Link
        </n-link> -->
      </template>
    </Masthead>

    <ResourceTable :schema="schema" :rows="rows" :group-by="groupBy" />
  </div>
</template>

<style lang="scss">
</style>
