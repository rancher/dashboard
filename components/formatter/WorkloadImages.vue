<script>
export default {
  props: {
    value: {
      type:     Function,
      default: () => {}
    },

    pods: {
      type:    Array,
      default: null
    },

    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    if (!this.pods) {
      this.workloadPods = await this.row.pods();
    }
  },

  data() {
    return { workloadPods: null };
  },

  computed: {
    images() {
      const pods = this.pods ? this.pods : this.workloadPods;

      return (pods || []).reduce((images, pod) => {
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
