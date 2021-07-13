<script>
import _ from 'lodash';
import randomstring from 'randomstring';
import { clone } from '@/utils/object';
import { HCI } from '@/config/types';
import { removeObject } from '@/utils/array.js';
import InfoBox from '@/components/InfoBox';
import { _VIEW } from '@/config/query-params';
import { sortBy } from '@/utils/sort';
import Base from './base';

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
    },

    namespace: {
      type:    String,
      default: null
    },
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
      const choices = this.$store.getters['cluster/all'](HCI.NETWORK_ATTACHMENT);

      const out = sortBy(
        choices
          .filter(C => C.metadata.namespace === 'default')
          .map((obj) => {
            return {
              label: obj.id,
              value: obj.id
            };
          }),
        'label'
      );

      const findPodIndex = _.findIndex(this.rows, (o) => {
        return o.networkName === MANAGEMENT_NETWORK;
      });

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
      let hasName = true;

      while (hasName) {
        name = `nic-${ this.nameIdx }`;
        hasName = this.rows.find( O => O.name === name);
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
    <div v-for="(row, i) in rows" :key="i">
      <InfoBox class="infoBox">
        <button v-if="!isView" type="button" class="role-link btn btn-lg remove-vol" @click="removeRow(row)">
          <i class="icon icon-2x icon-x" />
        </button>
        <h3>
          {{ t('harvester.vmPage.network.title') }}
        </h3>
        <div>
          <Base
            v-model="rows[i]"
            :rows="rows"
            :mode="mode"
            :network-option="networkOption"
            @update="update"
          />
        </div>
      </InfoBox>
    </div>
    <div v-if="!isView" class="row">
      <div class="col span-6">
        <button type="button" class="btn btn-sm bg-primary mr-15" @click="addRow">
          {{ t('harvester.vmPage.buttons.addNetwork') }}
        </button>
      </div>
    </div>
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
