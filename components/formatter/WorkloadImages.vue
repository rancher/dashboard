<script>
export default {
  props: {
    value: {
      type:     Function,
      default: () => {}
    },

    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    this.pods = await this.row.pods();
  },

  data() {
    return { pods: [] };
  },

  computed: {
    images() {
      return this.pods.reduce((images, pod) => {
        const podImages = pod.spec.containers.reduce((all, container) => {
          all.push(container.image);

          return all;
        }, []);

        images.push(...podImages);

        return images;
      }, []);
    }
  },
};
</script>

<template>
  <span>
    {{ images.join(', ') }}
  </span>
</template>
