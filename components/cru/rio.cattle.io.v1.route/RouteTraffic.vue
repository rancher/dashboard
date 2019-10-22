<script>
import LabeledInput from '@/components/form/LabeledInput';
import Destination from '@/components/cru/rio.cattle.io.v1.route/Destination';
export default {
  components: { LabeledInput, Destination },
  data() {
    return {
      routingMethods: ['forward', 'redirect', 'rewrite'],
      routingMethod:         'forward',
      host:           '',
      path:           '',
      shouldMirror:   false,
      shouldFault:    false,
      fault:          {},
      timeout:        '',
      retry:          {}
    };
  }
};
</script>

<template>
  <div>
    <template v-for="method in routingMethods">
      <input
        :key="method"
        v-model="routingMethod"
        type="radio"
        :value="method"
      >
      <label :key="method+'--label'">{{ method }}</label>
    </template>
    <div v-if="routingMethod !== 'forward'">
      <LabeledInput v-model="host" label="host" />
      <LabeledInput v-model="path" label="path" />
    </div>
    <div>
      <input v-model="shouldMirror" type="checkbox" name="shouldMirror" />
      <label for="shouldMirror">Mirror traffic</label>
      <Destination v-if="shouldMirror" />
    </div>
    <div>
      <input v-model="shouldFault" type="checkbox" name="shouldFault" />
      <label for="shouldFault">Define fault policy</label>
      <div v-if="shouldFault">
        <LabeledInput v-model="fault['percentage']" label="percentage" />
        <LabeledInput v-model="fault['delay']" label="delay (milliseconds)" />
        <LabeledInput v-model="fault['abort']" label="Abort code" />
      </div>
    </div>
    <div>
      <LabeledInput v-model="timeout" :disabled="shouldFault" label="timeout (milliseconds)" />
      <LabeledInput v-model="retry['attempts']" :disabled="shouldFault" label="retry attempts" />
      <LabeledInput v-model="retry['timeout']" :disabled="shouldFault" label="retry timeout" />
    </div>
  </div>
</template>
