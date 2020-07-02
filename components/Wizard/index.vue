<script>
export default {
  props:      {
    mode: {
      type:    String,
      default: 'create'
    }
  },

  data() {
    return { steps: [] };
  },

  created() {
    const { $children, $route: { hash } } = this;

    this.steps = $children;

    const stepNumber = (hash || '').replace(/^#/, '') || 1;

    const step = this.steps[stepNumber - 1] || this.steps[0];

    if ( step ) {
      this.goToStep(stepNumber);
    }
  },

  methods: {
    goToStep(number/* , event */) {
      const {
        steps,
        $route: { hash: routeHash },
      } = this;

      const selected = steps[number - 1];
      const hashName = `#${ number }`;

      if ( !selected || selected.disabled) {
        return;
      }

      if (routeHash !== hashName) {
        window.location.hash = `#${ number }`;
      }

      steps.map((step, idx) => {
        this.$set(step, 'active', idx === (number - 1));
      });

      this.$emit('changed', { step: selected });
    },

    selectNext(n) {
      // TODO go back/forward
    },
    cancel() {
      // TODO something
    }
  }
};
</script>

<template>
  <div>
    <ul
      class="steps"
      tabindex="0"
      @keyup.39.stop="selectNext(1)"
      @keyup.37.stop="selectNext(-1)"
    >
      <li
        v-for="(step, idx ) in steps"
        :id="step.name"
        :key="step.name"
        :class="{step: true, active: step.active, disabled: step.disabled}"
        role="presentation"
      >
        <a
          :aria-controls="'#' + idx+1"
          :aria-selected="step.active"
          role="tab"
          @click.prevent="goToStep(idx+1, $event)"
        >
          {{ idx+1 }}
        </a>
      </li>
    </ul>

    <div class="step-container">
      <slot>
      </slot>
    </div>
  </div>
</template>

<style>
.steps {
    margin: 0 20% 0 20%;;
    display:flex;
    justify-content: space-between;
    list-style-type:none;
}
</style>
