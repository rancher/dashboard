<script>
export const DEFAULT_SERVICE_TYPES = [
  {
    id:               'ClusterIP',
    translationLabel: 'serviceTypes.clusterip'
  },
  {
    id:               'ExternalName',
    translationLabel: 'serviceTypes.externalname'
  },
  {
    id:               'Headless',
    translationLabel: 'serviceTypes.headless'
  },
  {
    id:               'LoadBalancer',
    translationLabel: 'serviceTypes.loadbalancer'
  },
  {
    id:               'NodePort',
    translationLabel: 'serviceTypes.nodeport'
  },
];

export default {
  props: {
    value: {
      type:    String,
      default: ''
    }
  },
  data() {
    const match = DEFAULT_SERVICE_TYPES.find(s => s.id.toLowerCase() === this.value.toLowerCase());
    const { translationLabel } = match;
    let translated;

    if (translationLabel) {
      translated = this.$store.getters['i18n/t'](translationLabel);
    } else {
      translated = this.value;
    }

    return { translated };
  },
};
</script>>

<template>
  <span>{{ translated }}</span>
</template>
