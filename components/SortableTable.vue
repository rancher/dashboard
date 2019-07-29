<template>
  <div>
    Top
    <table width="100%">
      <thead>
        <tr>
          <th v-for="col in columnDefinitions" :key="col.name" align="left">
            {{ col.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.object.metadata.uid">
          <td v-for="(cell, idx) in row.cells" :key="idx">
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
    Bottom2
  </div>
</template>

<style lang="scss" scoped>

</style>

<script>
export default {
  props: {
    columnDefinitions: {
      type:     Array,
      default: () => [],
    },
    rows: {
      type:    Array,
      default: () => []
    }
  },

  data: () => ({
    columnDefinitions: [],

    rows: []
  }),
};
</script>
