<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { get } from '@shell/utils/object';

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
      type:    Object,
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
          label: this.t('istio.destinationRule.loadBalancer.simple.label'),
          value: true
        }, {
          label: this.t('istio.destinationRule.loadBalancer.consistentHash.label'),
          value: false
        },
      ],
      hashModeOptions: [
        {
          label: this.t('istio.destinationRule.loadBalancer.consistentHash.mode.header.label'),
          value: 'useHeader'
        },
        {
          label: this.t('istio.destinationRule.loadBalancer.consistentHash.mode.cookie.label'),
          value: 'useCookie'
        },
        {
          label: this.t('istio.destinationRule.loadBalancer.consistentHash.mode.sourceIp.label'),
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
    <div
      v-if="useSimple"
      class="row"
    >
      <div class="col span-6">
        <LabeledSelect
          v-model="value.simple"
          :options="simpleOptions"
          :label="t('istio.destinationRule.loadBalancer.label')"
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
            :label="t('istio.destinationRule.loadBalancer.consistentHash.mode.label')"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.consistentHash.minimumRingSize"
            :label="t('istio.destinationRule.loadBalancer.consistentHash.minimumRingSize.label')"
            type="number"
          />
        </div>
      </div>
      <div
        v-if="hashMode === 'useHeader'"
        class="row"
      >
        <div class="col span-6">
          <LabeledInput
            v-model="value.consistentHash.httpHeaderName"
            :label="t('istio.destinationRule.loadBalancer.consistentHash.httpHeaderName.label')"
            :placeholder="t('istio.destinationRule.loadBalancer.consistentHash.httpHeaderName.placeholder')"
          />
        </div>
      </div>

      <div
        v-if="hashMode === 'useCookie'"
        class="row"
      >
        <div class="col span-4">
          <LabeledInput
            v-model="value.consistentHash.httpCookie.name"
            :label="t('istio.destinationRule.loadBalancer.consistentHash.httpCookie.name.label')"
            :placeholder="t('istio.destinationRule.loadBalancer.consistentHash.httpCookie.name.placeholder')"
            required
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model="value.consistentHash.httpCookie.path"
            :label="t('istio.destinationRule.loadBalancer.consistentHash.httpCookie.path.label')"
            :placeholder="t('istio.destinationRule.loadBalancer.consistentHash.httpCookie.path.placeholder')"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model="value.consistentHash.httpCookie.ttl"
            :label="t('istio.destinationRule.loadBalancer.consistentHash.httpCookie.ttl.label')"
            :placeholder="t('istio.destinationRule.loadBalancer.consistentHash.httpCookie.ttl.placeholder')"
            required
          />
        </div>
      </div>
    </template>
  </div>
</template>
