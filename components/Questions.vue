<script>
import Jexl from 'jexl';
import Tab from '@/components/Tabbed/Tab';
import { get } from '@/utils/object';

function evalExpr(expr, values) {
  console.log('Evaluate Before', expr, values);

  expr = expr.replace(/([^= &|]+)=([&| ]|$)/g, '!$1 $2'); // key= (with no value) to key == ''
  expr = expr.replace(/([^=])=([^=])/g, '$1 == $2'); // key=val to key == val
  expr = expr.replace(/([^ ])(&&|==|\|\|)([^ ])/g, '$1 $2 $3'); // cond1&&cond2 to cond1 && cond2

  console.log('Evaluate After', expr, values);

  return Jexl.evalSync(expr, values);
}

export default {
  components: { Tab },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    chart: {
      type:     Object,
      required: true,
    },

    version: {
      type:     Object,
      required: true,
    },

    versionInfo: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return { valueGeneration: 0 };
  },

  computed: {
    allQuestions() {
      return this.versionInfo.questions.questions;
    },

    shownQuestions() {
      if ( this.valueGeneration < 0 ) {
        // Pointless condition to get this to depend on generation and recompute
        return;
      }

      const out = this.allQuestions.filter((q) => {
        if ( q.show_if ) {
          const shown = !!evalExpr(q.show_if, this.value);

          console.log('Show', q.variable, '(', q.show_if, ') =>', shown);

          return shown;
        } else {
          return true;
        }
      });

      console.log('Shown Questions', out.length, 'of', this.allQuestions.length);

      return out;
    },

    groups() {
      const map = {};

      for ( const q of this.shownQuestions ) {
        if ( q.group ) {
          const normalized = q.group.trim().toLowerCase();

          map[normalized] = q.group;
        }
      }

      return Object.values(map);
    },
  },

  watch: {
    value: {
      deep: true,

      handler() {
        console.log('Value changed', this.valueGeneration);
        this.valueGeneration++;
      },
    }
  },

  methods: { get },
};
</script>

<template>
  <div>
    <Tab name="questions" label="Questions">
      <h2>Groups</h2>
      <ul>
        <li v-for="g in groups" :key="g">
          {{ g }}
        </li>
      </ul>

      <h2>Questions</h2>
      <ul>
        <li v-for="q in shownQuestions" :key="q.variable">
          {{ q.variable }} ({{ q.type }}) = {{ get(value, q.variable) }}
        </li>
      </ul>
    </Tab>
  </div>
</template>
