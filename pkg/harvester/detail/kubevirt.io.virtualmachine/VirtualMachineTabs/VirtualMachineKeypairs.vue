<script>
import isString from 'lodash/isString';
import { HCI } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import impl from '../../../mixins/harvester-vm/impl';

export default {
  mixins: [impl],

  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  async fetch() {
    const hash = await allHash({ allSSHs: this.$store.dispatch('harvester/findAll', { type: HCI.SSH }) });

    this.allSSHs = hash.allSSHs;
  },

  data() {
    return {
      allSSHs:  [],
      sshKeys:  []
    };
  },

  methods: {
    toggleShow(idx) {
      const ssh = this.sshKeys[idx];

      this.$set(this.sshKeys, idx, {
        ...ssh,
        showKey: !ssh.showKey
      });
    },

    getKeys() {
      return this.mergeAllSSHs(this.value?.spec);
    },

    isShow(id = '') {
      const ssh = this.sshKeys.find(O => O?.data?.id === id) || {};

      return ssh.showKey || false;
    }
  },

  watch: {
    allSSHs(neu) {
      const out = this.getKeys().map((ssh) => {
        return {
          id:          ssh.id,
          publicKey:   isString(ssh.data) ? ssh.data : ssh.data?.spec?.publicKey,
          showKey:     this.isShow(ssh.id)
        };
      });

      this.$set(this, 'sshKeys', out);
    }
  }
};
</script>

<template>
  <div class="overview-sshKeys">
    <div v-for="(ssh, index) in sshKeys" :key="index" class="row overview-sshKeys__item">
      <div class="col span-4">
        {{ ssh.id }}
      </div>
      <div class="col span-7 offset-1">
        <div v-if="ssh.showKey" class="key-display">
          {{ ssh.publicKey }}
          <button class="btn btn-sm role-link hide-bar" @click="toggleShow(index)">
            <i class="icon icon-x"></i>
          </button>
        </div>
        <button v-else class="btn btn-sm role-link" @click="toggleShow(index)">
          *******<i class="icons icon-show"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .overview-sshKeys {
    text-align: left;
    max-height: 700px;
    overflow: auto;

    &__item {
      margin-bottom: 15px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .key-display {
      position: relative;
      padding-right: 30px;
      word-break: break-word;

      .hide-bar {
        position: absolute;
        top: -10px;
        right: 10px;
      }
    }
  }
</style>
