<script>
import findIndex from 'lodash/findIndex';
import randomstring from 'randomstring';

import InfoBox from '@/components/InfoBox';
import Base from '@/edit/kubevirt.io.virtualmachine/network/base';

import { HCI } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { clone } from '@/utils/object';
import { removeObject } from '@/utils/array';
import { _VIEW } from '@/config/query-params';

const MANAGEMENT_NETWORK = 'management Network';

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
      const choices = this.$store.getters['virtual/all'](HCI.NETWORK_ATTACHMENT);

      const out = sortBy(
        choices.map((N) => {
          return {
            label: N.id,
            value: N.id
          };
        }),
        'label'
      );

      const findPodIndex = findIndex(this.rows, R => R.networkName === MANAGEMENT_NETWORK);

      if (findPodIndex === -1 || (findPodIndex !== -1 && this.rows.length === 1)) {
        out.push({
          label: MANAGEMENT_NETWORK,
          value: MANAGEMENT_NETWORK
        });
      }

      return out;
    },

    networkName() {
      return this.networkOption?.[0]?.value || '';
    }
  },

  watch: {
    value(neu) {
      this.rows = neu;
    },
  },

  methods: {
    addRow(type) {
      const name = this.getName();

      const neu = {
        name,
        model:       'virtio',
        type:        'bridge',
        networkName: '',
        newCreateId:      randomstring.generate(10),
      };

      if (this.networkName === MANAGEMENT_NETWORK) {
        neu.isPod = true;
      }

      this.rows.push(neu);
      this.$emit('input', this.rows);
      this.rows[this.rows.length - 1].networkName = this.networkName;
    },

    removeRow(vol) {
      removeObject(this.rows, vol);
      this.$emit('input', this.rows);
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
      <button v-if="!isView" type="button" class="role-link btn btn-sm remove-vol" @click="removeRow(row)">
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

    <button v-if="!isView" type="button" class="btn btn-sm bg-primary" @click="addRow">
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
  right: 10px;
  padding:0px;
}
</style>
