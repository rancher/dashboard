import $ from 'jquery';

export default {
  methods: {
    mappedKeys(map, vm) {
      // Defaults found at - https://github.com/sagalbot/vue-select/blob/master/src/components/Select.vue#L947
      const out = { ...map };

      // tab
      (out[9] = (e) => {
        e.preventDefault();

        const optsLen = vm.filteredOptions.length;
        const typeAheadPointer = vm.typeAheadPointer;

        if (e.shiftKey) {
          if (typeAheadPointer === 0) {
            vm.$refs.search.focus();

            return vm.onEscape();
          }

          return vm.typeAheadUp();
        }
        if (typeAheadPointer + 1 === optsLen) {
          $(vm.$el).next().focus();

          return vm.onEscape();
        }

        return vm.typeAheadDown();
      });

      return out;
    },
  }
};
