<script>
import Jexl from 'jexl';
import Tab from '@/components/Tabbed/Tab';
import { get, set } from '@/utils/object';
import StringType from './String';
import BooleanType from './Boolean';
import EnumType from './Enum';
import IntType from './Int';

const knownTypes = {
  string:    StringType,
  hostname:  StringType, // @TODO
  multiline: StringType,
  password:  StringType,
  boolean:   BooleanType,
  enum:      EnumType,
  int:       IntType,
  // storageclass
  // pvc
  // secret
};

function evalExpr(expr, values) {
  try {
    const out = Jexl.evalSync(expr, values);

    // console.log('Eval', expr, '=> ', out);

    return out;
  } catch (err) {
    console.error('Error evaluating expression:', expr, values); // eslint-disable-line no-console

    return true;
  }
}

function shouldShow(q, values) {
  let expr = q.if;

  if ( expr === undefined && q.show_if !== undefined ) {
    expr = migrate(q.show_if);
  }

  if ( expr ) {
    const shown = !!evalExpr(expr, values);

    return shown;
  }

  return true;
}

function shouldShowSub(q, values) {
  // Sigh, both singular and plural are used in the wild...
  let expr = ( q.subquestions_if === undefined ? q.subquestion_if : q.subquestions_if);
  const old = ( q.show_subquestions_if === undefined ? q.show_subquestion_if : q.show_subquestions_if);

  if ( !expr && old !== undefined ) {
    if ( old === false || old === 'false' ) {
      expr = `!${ q.variable }`;
    } else if ( old === true || old === 'true' ) {
      expr = `!!${ q.variable }`;
    } else {
      expr = `${ q.variable } == "${ old }"`;
    }
  }

  if ( expr ) {
    return evalExpr(expr, values);
  }

  return true;
}

function migrate(expr) {
  let out;

  if ( expr.includes('||') ) {
    out = expr.split('||').map(x => migrate(x)).join(' || ');
  } else if ( expr.includes('&&') ) {
    out = expr.split('&&').map(x => migrate(x)).join(' && ');
  } else {
    const parts = expr.match(/^(.*)(!?=)(.*)$/);

    if ( parts ) {
      const key = parts[1].trim();
      const op = parts[2].trim() === '!=' ? '!=' : '==';
      const val = parts[3].trim();

      if ( val === 'true' || val === 'false' || val === 'null' ) {
        out = `${ key } ${ op } ${ val }`;
      } else if ( val === '' ) {
        // Existing charts expect `foo=` with `{foo: null}` to be true.
        if ( op === '!=' ) {
          out = `!!${ key }`;
        } else {
          out = `!${ key }`;
        }
        // out = `${ op === '!' ? '!' : '' }(${ key } == "" || ${ key } == null)`;
      } else {
        out = `${ key } ${ op } "${ val }"`;
      }
    } else {
      try {
        Jexl.compile(expr);

        out = expr;
      } catch (e) {
        console.error('Error migrating expression:', expr); // eslint-disable-line no-console

        out = 'true';
      }
    }
  }

  return out;
}

export default {
  components: { Tab, ...knownTypes },

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

    targetNamespace: {
      type:     String,
      required: true
    }
  },

  data() {
    return { valueGeneration: 0 };
  },

  computed: {
    allQuestions() {
      return this.versionInfo.questions.questions;
    },

    shownQuestions() {
      const values = this.value;

      if ( this.valueGeneration < 0 ) {
        // Pointless condition to get this to depend on generation and recompute
        return;
      }

      const out = [];

      for ( const q of this.allQuestions ) {
        addQuestion(q);
      }

      return out;

      function addQuestion(q, depth = 1, parentGroup) {
        if ( !shouldShow(q, values) ) {
          return;
        }

        q.depth = depth;
        q.group = q.group || parentGroup;

        out.push(q);

        if ( q.subquestions?.length && shouldShowSub(q, values) ) {
          for ( const sub of q.subquestions ) {
            addQuestion(sub, depth + 1, q.group);
          }
        }
      }
    },

    groups() {
      const map = {};
      const defaultGroup = 'Questions';
      let weight = this.shownQuestions.length;

      for ( const q of this.shownQuestions ) {
        if ( q.group ) {
          const normalized = q.group.trim().toLowerCase();

          if ( !map[normalized] ) {
            map[normalized] = {
              name:      q.group || defaultGroup,
              questions: [],
              weight:    weight--,
            };
          }

          map[normalized].questions.push(q);
        }
      }

      const out = Object.values(map);

      return out;
    },
  },

  watch: {
    value: {
      deep: true,

      handler() {
        this.valueGeneration++;
      },
    }
  },

  methods: {
    get,
    set,

    componentForQuestion(q) {
      if ( knownTypes[q.type] ) {
        return q.type;
      }

      return 'string';
    }
  },
};
</script>

<template>
  <div>
    <Tab
      v-for="g in groups"
      :key="g.name"
      :name="g.name"
      :label="g.name"
      :weight="g.weight"
    >
      <div v-for="q in g.questions" :key="q.variable" class="row question">
        <div class="col span-12">
          <component
            :is="componentForQuestion(q)"
            :question="q"
            :target-namespace="targetNamespace"
            :value="get(value, q.variable)"
            @input="set(value, q.variable, $event)"
          />
        </div>
      </div>
    </Tab>
  </div>
</template>

<style lang="scss" scoped>
  .question {
    margin-top: 10px;

    &:first-child {
      margin-top: 0;
    }
  }
</style>
