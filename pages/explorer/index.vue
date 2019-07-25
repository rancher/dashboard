<template>
  <div>
    Explorer Index

    <table width="100%">
      <thead>
        <tr>
          <th v-for="col in data.columnDefinitions" :key="col.name" align="left">
            {{ col.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data.rows" :key="row.object.metadata.uid">
          <td v-for="(cell, idx) in row.cells" :key="idx">
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>

    <pre>{{ data }}</pre>
  </div>
</template>

<script>
export default {
  asyncData(ctx) {
    const podDef = ctx.$k8s.resources.find(x => x.name === 'pods');

    return ctx.$axios.get(podDef.basePath, { headers: { accept: 'application/json;as=Table;g=meta.k8s.io;v=v1beta1' } });
  }
};
</script>
