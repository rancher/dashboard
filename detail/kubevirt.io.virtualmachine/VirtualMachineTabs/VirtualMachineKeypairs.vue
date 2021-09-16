<script>
import { HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({ allSSHs: this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.SSH }) });

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
      const keys = this.value?.spec?.template?.metadata?.annotations?.[HCI_ANNOTATIONS.SSH_NAMES];
      const volumes = this.value?.spec?.template?.spec?.volumes;
      let userData = null;

      // find userData
      volumes.forEach((v) => {
        if (v.cloudInitNoCloud) {
          userData = v.cloudInitNoCloud.userData;
        }
      });

      if (!keys && !userData) {
        return [];
      }

      return this.serializing(this.allSSHs, keys, userData) || [];
    },

    serializing(allSSHs, keys = '', userData = '') {
      let out = [];
      const r = /(\r\n\t|\n|\r\t)|(\s*)/gm;

      keys = keys.split('').filter((k) => {
        return !['[', ']', '"'].includes(k);
      });

      keys = keys.join('').split(',');

      userData = userData?.split('- >-').splice(1) || [];

      out = allSSHs.filter(ssh => keys.includes(ssh.id)).map((ssh) => {
        return {
          data:    ssh,
          showKey: this.isShow(ssh.id)
        };
      });

      for (const ssh of out) {
        userData = userData.filter((data) => {
          return data.replace(r, '') !== ssh.data.spec.publicKey.replace(r, '');
        });
      }

      userData = userData.map((pub) => {
        return {
          data: {
            id:   'Unknown',
            spec: { publicKey: pub },
          },
          showKey: this.isShow()
        };
      });

      return out.concat(userData);
    },

    isShow(id = '') {
      const ssh = this.sshKeys.find(O => O.data.id === id) || {};

      return ssh.showKey || false;
    }
  },

  watch: {
    allSSHs(neu) {
      this.sshKeys = this.getKeys();
    }
  }
};
</script>

<template>
  <div class="overview-sshKeys">
    <div v-for="(ssh, index) in sshKeys" :key="index" class="row overview-sshKeys__item">
      <div class="col span-4">
        {{ ssh.data.id }}
      </div>
      <div class="col span-7 offset-1">
        <div v-if="ssh.showKey" class="key-display">
          {{ ssh.data.spec.publicKey }}
          <button class="btn btn-sm role-link hide-bar" @click="toggleShow(index)">
            <i class="icon icon-x"></i>
          </button>
        </div>
        <button v-else class="btn btn-sm role-link" @click="toggleShow(index)">
          *******<i class="icons icon-h-eye"></i>
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
