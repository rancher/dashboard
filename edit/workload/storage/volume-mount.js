import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import Mount from '@/edit/workload/storage/volume-mount';
export default {
  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    Mount
  },
  props:      {
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const container = this.podSpec.containers[0];

    const volumeMounts = container.volumeMounts.filter(mount => mount.name === this.value.name);

    return { volumeMounts };
  },

  computed: {
    type() {
      return Object.keys(this.value).filter(key => key !== 'name')[0];
    },
  },

  watch: {
    volumeMounts(neu) {
      const container = this.podSpec.containers[0];

      container.volumeMounts = container.volumeMounts.filter(mount => mount.name !== this.value.name);
      container.volumeMounts.push(...neu);
    }
  },

  methods: {
    updateMountNames(name) {
      this.volumeMounts.forEach((mount) => {
        mount.name = name;
      });
    }
  }
};
