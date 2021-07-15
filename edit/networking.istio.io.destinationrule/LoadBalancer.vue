<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';
import { get } from '@/utils/object';

export default {

  components: {
    RadioGroup,
    LabeledSelect,
    LabeledInput
  },

  props: {
    mode: {
      type:    String,
      default: 'edit'
    },

    // destinationrule.spec.trafficPolicy.loadBalancer
    value: {
      type:     Object,
      default: () => {}
    }
  },

  data() {
    // attempt to initialize useSimple and hashMode off existing properties so the right radio opts are selected when mode=edit
    const useSimple = !!this.value.simple;
    let hashMode;

    if (!!get(this.value, 'consistentHash.httpHeaderName')) {
      hashMode = 'useHeader';
    } else if (!!get(this.value, 'consistentHash.httpCookie')) {
      hashMode = 'useCookie';
    } else if (!!get(this.value, 'consistentHash.useSourceIp')) {
      hashMode = 'useIP';
    }

    return {
      useSimple,
      hashMode,

      simpleOptions: ['ROUND_ROBIN', 'LEAST_CONN', 'RANDOM', 'PASSTHROUGH'],
      modeOptions:   [
        {
          label: 'Use standard load balancing algorithms',
          value: true
        }, {
          label: 'Use consistent hash-based load balancing for soft session affinity',
          value: false
        },
      ],
      hashModeOptions: [
        {
          label: 'Hash based on specific HTTP header',
          value: 'useHeader'
        },
        {
          label: 'Hash based on HTTP cookie',
          value: 'useCookie'
        },
        {
          label: 'Hash based on the source IP address',
          value: 'useIp'
        }
      ],
    };
  },

  watch: {
    useSimple(neu) {
      if (neu) {
        delete this.value.consistentHash;
        this.value.simple = this.simpleOptions[0];
      } else {
        delete this.value.simple;
        this.$set(this.value, 'consistentHash', { minimumRingSize: 1024 });
        // set hashMode here to trigger watcher and initialize relevant object props
        this.hashMode = 'useHeader';
      }
    },

    hashMode(neu) {
      switch (neu) {
      case 'useHeader':
        delete this.value.consistentHash.httpCookie;
        delete this.value.consistentHash.useSourceIp;
        this.$set(this.value.consistentHash, 'httpHeaderName', '');
        break;
      case 'useCookie':
        delete this.value.consistentHash.httpHeaderName;
        this.$set(this.value.consistentHash, 'httpCookie', {});
        break;
      default:
        delete this.value.consistentHash.httpCookie;
        delete this.value.consistentHash.httpHeaderName;
        this.$set(this.value.consistentHash, 'useSourceIp', true);
        break;
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <RadioGroup
        v-model="useSimple"
        name="loadBalancer"
        :mode="mode"
        :options="modeOptions"
      />
    </div>
    <div v-if="useSimple" class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.simple"
          :options="simpleOptions"
          label="Algorithm"
          :mode="mode"
        />
      </div>
    </div>
    <template v-else>
      <div class="row mt-20">
        <div class="col span-6">
          <RadioGroup
            v-model="hashMode"
            name="HashOptions"
            :mode="mode"
            :options="hashModeOptions"
            label="Hash Mode"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput v-model="value.consistentHash.minimumRingSize" label="Minimum Ring Size" type="number" />
        </div>
      </div>
      <div v-if="hashMode === 'useHeader'" class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.consistentHash.httpHeaderName"
            label="HTTP Header Name"
            placeholder="e.g. end-user"
          />
        </div>
      </div>

      <div v-if="hashMode === 'useCookie'" class="row">
        <div class="col span-4">
          <LabeledInput
            v-model="value.consistentHash.httpCookie.name"
            label="Cookie Name"
            placeholder="e.g. username"
            required
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model="value.consistentHash.httpCookie.path"
            label="Cookie Path"
            placeholder="e.g. /"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model="value.consistentHash.httpCookie.ttl"
            label="TTL"
            placeholder="e.g. 0s"
            required
          />
        </div>
      </div>
    </template>
  </div>
</template>
