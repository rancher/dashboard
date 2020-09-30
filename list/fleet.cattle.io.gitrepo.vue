<script>
import FleetRepos from '@/components/FleetRepos';

export default {
  name:       'ListGitRepo',
  components: { FleetRepos },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },
};
</script>

<template>
  <FleetRepos
    :rows="rows"
    :schema="schema"
  />
</template>
