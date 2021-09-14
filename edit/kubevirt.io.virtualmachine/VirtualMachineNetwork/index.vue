<script>
import InfoBox from '@/components/InfoBox';
import Base from '@/edit/kubevirt.io.virtualmachine/VirtualMachineNetwork/base';

import { HCI } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { clone } from '@/utils/object';
import { randomStr } from '@/utils/string';
import { removeObject } from '@/utils/array';
import { _VIEW } from '@/config/query-params';

export default {
  components: { InfoBox, Base },

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    value: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return {
      rows:    clone(this.value),
      nameIdx: 1
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    networkOption() {
      const choices = this.$store.getters['harvester/all'](HCI.NETWORK_ATTACHMENT);

      const out = sortBy(
        choices.map((N) => {
          return {
            label: N.id,
            value: N.id
          };
        }),
        'label'
      );

      return out;
    },
  },

  watch: {
    value(neu) {
      this.rows = neu;
    },
  },

  methods: {
    add(type) {
      const name = this.getName();

      const neu = {
        name,
        model:       'virtio',
        type:        'bridge',
        networkName:  this.networkName,
        newCreateId:      randomStr(10),
      };

      this.rows.push(neu);
      this.update();
    },

    remove(vol) {
      removeObject(this.rows, vol);
      this.update();
    },

    getName() {
      let name = '';
      let hasUsed = true;

      while (hasUsed) {
        name = `nic-${ this.nameIdx }`;
        hasUsed = this.rows.find( O => O.name === name);
        this.nameIdx++;
      }

      return name;
    },

    update() {
      this.$emit('input', this.rows);
    }
  }
};
</script>

<template>
  <div>
    <InfoBox v-for="(row, i) in rows" :key="i" class="infoBox">
      <button v-if="!isView" type="button" class="role-link remove-vol" @click="remove(row)">
        <i class="icon icon-2x icon-x" />
      </button>

      <h3> {{ t('harvester.virtualMachine.network.title') }} </h3>

      <Base
        v-model="rows[i]"
        :rows="rows"
        :mode="mode"
        :network-option="networkOption"
        @update="update"
      />
    </InfoBox>

    <button v-if="!isView" type="button" class="btn btn-sm bg-primary" @click="add">
      {{ t('harvester.virtualMachine.network.addNetwork') }}
    </button>
  </div>
</template>

<style lang='scss' scoped>
.infoBox{
  position: relative;
}

.remove-vol {
  position: absolute;
  top: 10px;
  right: 16px;
  padding:0px;
  max-height: 28px;
  min-height: 28px;
}
</style>
