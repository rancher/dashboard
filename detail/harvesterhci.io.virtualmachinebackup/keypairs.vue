<script>
// need reproudct, with vm detail keypairs
import { HCI } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  data() {
    return {
      visible: false,
      allssh:  [],
      sshkeys: [],
    };
  },

  created() {
    const ssh = this.$store.getters['virtual/all'](HCI.SSH);

    this.allssh = ssh || [];
    this.getKey();
  },

  methods: {
    getKey() {
      const keys = this.value?.virtualMachineSpec?.template?.metadata?.annotations?.[HCI_ANNOTATIONS.SSH_NAMES];
      const volumes = this.value?.virtualMachineSpec?.template?.spec?.volumes;
      let userData = null;

      this.sshkeys = [];

      // find userData
      volumes.forEach((v) => {
        if (v.cloudInitNoCloud) {
          userData = v.cloudInitNoCloud.userData;
        }
      });

      if (!keys && !userData) {
        return;
      }

      this.sshkeys = this.serializing(keys, userData);
    },

    viewKey(index) {
      const neu = this.sshkeys[index];

      neu.showKey = true;

      this.$set(this.sshkeys, index, neu);
    },

    hideKey(index) {
      const neu = this.sshkeys[index];

      neu.showKey = false;

      this.$set(this.sshkeys, index, neu);
    },

    serializing(keys = '', userData = '') {
      let out = [];
      const r = /(\r\n\t|\n|\r\t)|(\s*)/gm;

      keys = keys.split('').filter((k) => {
        return !['[', ']', '"'].includes(k);
      });
      keys = keys.join('').split(',');

      userData = userData?.split('- >-').splice(1) || [];

      out = this.allssh.filter(ssh => keys.includes(ssh.metadata.name)).map((ssh) => {
        return {
          ...ssh,
          showKey: false
        };
      });

      for (const ssh of out) {
        userData = userData.filter((data) => {
          return data.replace(r, '') !== ssh.spec.publicKey.replace(r, '');
        });
      }

      userData = userData.map((pub) => {
        return {
          metadata: { name: 'Unknown' },
          spec:     { publicKey: pub },
          showKey:  false
        };
      });

      return out.concat(userData);
    }
  }
};
</script>

<template>
  <div class="sshkeys-modal">
    <div class="overview-sshkeys">
      <div v-for="(ssh, index) in sshkeys" :key="ssh.id" class="row overview-sshkeys__item">
        <div class="col span-4">
          {{ ssh.metadata.name }}
        </div>
        <div class="col span-7 offset-1">
          <div v-if="ssh.showKey" class="key-display">
            {{ ssh.spec.publicKey }}
            <button class="btn btn-sm role-link hide-bar" @click="hideKey(index)">
              <i class="icon icon-x" />
            </button>
          </div>
          <button v-else class="btn btn-sm role-link" @click="viewKey(index)">
            *******<i class="icons icon-h-eye" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .overview-sshkeys {
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
