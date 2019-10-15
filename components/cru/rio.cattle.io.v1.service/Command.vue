<script>
import LabeledInput from '@/components/form/LabeledInput';
import ShellInput from '@/components/form/ShellInput';
import UnitInput from '@/components/form/UnitInput';

export default {
  components: {
    LabeledInput, ShellInput, UnitInput
  },
  props:      {
    spec: {
      type:     Object,
      required: true,
    }
  },

  computed() {

  },
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <UnitInput
          v-model="spec.memory"
          :increment="1024"
          label="Memory Reservation"
          placeholder="Default: None"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="spec.cpu"
          label="CPU Reservation"
          :increment="1000"
          :input-exponent="-1"
          suffix="CPUs"
          placeholder="Default: None"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-9">
        <ShellInput
          v-model="spec.entrypoint"
          label="Entrypoint"
        />
      </div>

      <div class="col span-3 pt-5">
        <div><label class="checkbox"><input v-model="spec.stdin" type="checkbox" /> Interactive</label></div>
        <div><label class="checkbox"><input v-model="spec.tty" type="checkbox" /> TTY</label></div>
        <div><label class="checkbox"><input v-model="spec.readOnlyRootFilesystem" type="checkbox" /> Read-Only Root FS</label></div>
      </div>
    </div>

    <div class="row">
      <div class="col span-12">
        <ShellInput
          v-model="spec.command"
          label="Command"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model="spec.workingDir"
          label="Working Directory"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="spec.runAsUser"
          label="Run as User number"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="spec.runAsGroup"
          label="Run as Group number"
        />
      </div>
    </div>

    <hr />

    <p>--env (var, from config map, from secret)</p>
  </div>
</template>
