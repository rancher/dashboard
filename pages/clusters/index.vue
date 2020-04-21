<script>
export default {
  layout: 'blank',

  fetch({ store, redirect }) {
    const id = store.getters['defaultClusterId'];

    if ( id ) {
      redirect(`/c/${ escape(id) }`);
    }
  }
};
</script>

<template>
  <div>
    You don't have any clusters...
  </div>
</template>
