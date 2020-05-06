<script>
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: {
    RadioGroup, LabeledInput, LabeledSelect
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    certs: {
      type:    Array,
      default: () => []
    },
  },

  data() {
    const { hosts = [''], secretName = '' } = this.value;

    return {
      hosts, secretName, useDefault: !!secretName.length
    };
  },
  methods: {
    addHost() {
      this.hosts.push('');
      this.update();
    },
    remove(idx) {
      this.hosts.splice(idx, 1);
      this.update();
    },

    update() {
      const out = { hosts: this.hosts };

      if (!this.useDefault) {
        out.secretName = this.secretName;
      }

      this.$emit('input', out);
    }
  }
};
</script>

<template>
  <div class="cert" @input="update">
    <div class="row">
      <RadioGroup
        v-model="useDefault"
        class="col span-6"
        :options="[true, false]"
        :labels="['Use default ingress controller certificate', 'Choose a certificate']"
        @input="update"
      />
      <div class="col span-5">
        <LabeledSelect
          v-if="!useDefault"
          :value="secretName"
          :options="certs"
          label="Certificate"
          required
          @input="e=>{secretName = e; update()}"
        />
      </div>
      <div class="col span-1">
        <button class="btn role-link close" @click="$emit('remove')">
          <i class="icon icon-2x icon-x" />
        </button>
      </div>
    </div>
    <div v-for="(host, i) in hosts" :key="i" class="row mb-10">
      <div :style="{'margin-right': '0px'}" class="col span-11">
        <LabeledInput :value="host" label="Host" placeholder="e.g. example.com" @input="e=>$set(hosts, i, e)" />
      </div>
      <button class="btn btn-sm role-link col" @click="e=>remove(i)">
        remove
      </button>
    </div>
    <button :style="{'padding':'0px 0px 0px 5px'}" class="bn btn-sm role-link" @click="addHost">
      add host
    </button>
  </div>
</template>

<style lang='scss' scoped>
  .close{
    float:right;
    padding: 0px;
    position: relative;
    top: -25px;
    right: -25px;
  }
  .cert:not(:last-of-type) {
    padding-bottom: 10px;
    margin-bottom:30px;
    border-bottom: 1px solid var(--border);
  }

  button {
    line-height: 40px;
  }
</style>
