<script>
import Jexl from 'jexl';
import Tab from '@shell/components/Tabbed/Tab';
import { get, set } from '@shell/utils/object';
import { sortBy, camelCase } from 'lodash';
import { _EDIT } from '@shell/config/query-params';
import StringType from './String';
import BooleanType from './Boolean';
import EnumType from './Enum';
import IntType from './Int';
import FloatType from './Float';
import ArrayType from './Array';
import MapType from './QuestionMap';
import ReferenceType from './Reference';
import CloudCredentialType from './CloudCredential';
import RadioType from './Radio';
import YamlType from './Yaml';
import Loading from '@shell/components/Loading';

export const knownTypes = {
  string:          StringType,
  hostname:        StringType,
  multiline:       StringType,
  password:        StringType,
  ipaddr:          StringType,
  cidr:            StringType,
  cron:            StringType,
  boolean:         BooleanType,
  enum:            EnumType,
  int:             IntType,
  float:           FloatType,
  questionMap:     MapType,
  reference:       ReferenceType,
  configmap:       ReferenceType,
  secret:          ReferenceType,
  storageclass:    ReferenceType,
  pvc:             ReferenceType,
  cloudcredential: CloudCredentialType,
  radio:           RadioType,
  yaml:            YamlType,
};

export function componentForQuestion(q) {
  const type = (q.type || '').toLowerCase();

  if ( knownTypes[type] ) {
    return type;
  } else if ( type.startsWith('array') ) { // This only really works for array[string|multiline], but close enough for now.
    return ArrayType;
  } else if ( type.startsWith('map') ) { // Same, only works with map[string|multiline]
    return MapType;
  } else if ( type.startsWith('reference[') ) { // Same, only works with map[string|multiline]
    return ReferenceType;
  }

  return 'string';
}

export function schemaToQuestions(fields) {
  const keys = Object.keys(fields);
  const out = [];

  for ( const k of keys ) {
    out.push({
      variable: k,
      label:    k,
      ...fields[k],
    });
  }

  return out;
}

/**
 * Migrates a legacy/Ember-style `show_if` expression to a modern, valid Jexl expression.
 *
 * In legacy Helm charts, `show_if` is specified as simple equations without quotes,
 * like "parent.variable=false" or "a=foo&&b=bar". Jexl requires correct quotes and
 * comparison operators (e.g. `parent.variable == false`).
 *
 * To support complex nested conditions (e.g., "(a=true || b=true) && c=true"), this function
 * tokenizes the string on logical boundaries while preserving parentheses and operators,
 * migrating only the leaf atomic sub-expressions.
 */
function migrate(expr) {
  if (typeof expr !== 'string') {
    return expr;
  }

  const grouped = migrateGrouped(expr);

  // Tokenizing on (, ) and ! can also split inside a comparison's value (e.g. "foo=bar(1)"
  // or "foo=a!b"), producing invalid Jexl. Guard against that by only trusting the grouped
  // migration if it actually compiles, and falling back to the simpler, ungrouped migration
  // (which doesn't support explicit parentheses/negation, but won't mangle raw values) otherwise.
  try {
    Jexl.compile(grouped);

    return grouped;
  } catch (e) {
    return migrateUngrouped(expr);
  }
}

/**
 * Migrates a `show_if` expression that may use grouping parentheses and/or unary NOT (e.g.
 * "(a=true || b=true) && c=true") by tokenizing on logical boundaries and migrating only the
 * leaf atomic sub-expressions. This can misfire if `(`, `)` or `!` appear within a value itself.
 */
function migrateGrouped(expr) {
  // Tokenize the expression by logical operators (&&, ||), parentheses ( ( , ) ) and unary NOT (!).
  // Note: we use a negative lookahead `!(?!=)` to match prefix `!` but leave `!=` comparison operators intact.
  const tokens = expr.split(/(&&|\|\||\(|\)|!(?!=))/);
  const migratedTokens = tokens.map((token) => {
    const trimmed = token.trim();

    // If the token is empty (e.g., spacing/delimiters), return as-is to preserve layout.
    if (!trimmed) {
      return token;
    }

    // Keep logical operators, parentheses, and unary NOT operators as-is.
    const isLogicalOrBoundary = ['&&', '||', '(', ')', '!'].includes(trimmed);

    if (isLogicalOrBoundary) {
      return token;
    }

    // Process and migrate actual comparison terms or variable identifiers.
    return migrateAtomic(trimmed);
  });

  return migratedTokens.join('');
}

/**
 * Migrates a `show_if` expression by splitting only on && / || (no support for grouping
 * parentheses or unary NOT), matching the legacy behavior. Safe for values that contain
 * `(`, `)` or `!`.
 */
function migrateUngrouped(expr) {
  if ( expr.includes('||') ) {
    return expr.split('||').map((x) => migrateUngrouped(x)).join(' || ');
  } else if ( expr.includes('&&') ) {
    return expr.split('&&').map((x) => migrateUngrouped(x)).join(' && ');
  }

  return migrateAtomic(expr);
}

/**
 * Migrates a single atomic comparison or variable expression to a valid Jexl format.
 * E.g.: "foo=bar" -> "foo == 'bar'", "foo=" -> "!foo"
 */
function migrateAtomic(expr) {
  let out;
  // The first group is lazy and `!=` is matched explicitly (rather than via `!?=`) so that the
  // '!' of `!=` isn't greedily consumed into the key, e.g. "foo!=bar" -> key: "foo", op: "!=".
  const parts = expr.match(/^(.*?)\s*(!=|=)\s*(.*)$/);

  if ( parts ) {
    const key = parts[1].trim();
    const op = parts[2] === '!=' ? '!=' : '==';
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

  return out;
}

export default {
  emits: ['updated'],

  components: {
    ...knownTypes,
    Tab,
    Loading,
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },

    value: {
      type:     Object,
      required: true,
    },

    tabbed: {
      type:    [Boolean, String],
      default: true,
    },

    // Can be a chartVersion, resource Schema, or an Array of question objects
    source: {
      type:     [Object, Array],
      required: true,
    },

    targetNamespace: {
      type:     String,
      required: true
    },

    ignoreVariables: {
      type:    Array,
      default: () => [],
    },

    disabled: {
      type:    Boolean,
      default: false,
    },

    inStore: {
      type:    String,
      default: 'cluster'
    },

    emit: {
      type:    Boolean,
      default: false,
    }
  },

  async fetch() {
    // If this source is a schema, ensure the schema's `resourceFields` is populated
    if (this.source.type === 'schema' && this.source.requiresResourceFields) {
      await this.source.fetchResourceFields();
    }
  },

  data() {
    return { valueGeneration: 0 };
  },

  computed: {
    allQuestions() {
      if ( this.source.questions?.questions ) {
        return this.source.questions.questions;
      } else if ( this.source.type === 'schema' && this.source.resourceFields ) {
        return schemaToQuestions(this.source.resourceFields);
      } else if ( typeof this.source === 'object' ) {
        return schemaToQuestions(this.source);
      } else {
        return [];
      }
    },

    shownQuestions() {
      const values = this.value;
      const vm = this;

      if ( this.valueGeneration < 0 ) {
        // Pointless condition to get this to depend on generation and recompute
        return;
      }

      const out = [];

      for ( const q of this.allQuestions ) {
        if ( this.ignoreVariables.includes(q.variable) ) {
          continue;
        }

        addQuestion(q);
      }

      return out;

      function addQuestion(q, depth = 1, parentGroup) {
        if ( !vm.shouldShow(q, values) ) {
          return;
        }

        q.depth = depth;
        q.group = q.group || parentGroup;

        out.push(q);

        if ( q.subquestions?.length && vm.shouldShowSub(q, values) ) {
          for ( const sub of q.subquestions ) {
            addQuestion(sub, depth + 1, q.group);
          }
        }
      }
    },

    chartName() {
      return this.source.chart?.name;
    },

    groups() {
      const map = {};
      const defaultGroup = 'Questions';
      let weight = this.shownQuestions.length;

      for ( const q of this.shownQuestions ) {
        const group = q.group || defaultGroup;

        const normalized = group.trim().toLowerCase();
        const name = this.$store.getters['i18n/withFallback'](`charts.${ this.chartName }.group.${ camelCase(group) }`, null, group);

        if ( !map[normalized] ) {
          map[normalized] = {
            name,
            questions: [],
            weight:    weight--,
          };
        }

        map[normalized].questions.push(q);
      }

      const out = Object.values(map);

      return sortBy(out, 'weight:desc');
    },

    asTabs() {
      if ( this.tabbed === false || this.tabbed === 'never' ) {
        return false;
      }

      if ( this.tabbed === 'multiple' ) {
        return !!this.groups.length;
      }

      return true;
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
    componentForQuestion,

    update(variable, $event) {
      set(this.value, variable, $event);
      if (this.emit) {
        this.$emit('updated');
      }
    },
    evalExpr(expr, values, question, allQuestions) {
      try {
        const out = Jexl.evalSync(expr, values);

        // console.log('Eval', expr, '=> ', out);

        // If the variable contains a hyphen, check if it evaluates to true
        // according to the evaluation logic used in the old UI.
        // This helps users avoid manual work to migrate from legacy apps.
        if (!out && expr.includes('-')) {
          const res = this.evaluate(question, allQuestions);

          return res;
        }

        return out;
      } catch (err) {
        console.error('Error evaluating expression:', expr, values); // eslint-disable-line no-console

        return true;
      }
    },
    evaluate(question, allQuestions) {
      if ( !question.show_if ) {
        return true;
      }
      const and = question.show_if.split('&&');
      const or = question.show_if.split('||');

      let result;

      if ( get(or, 'length') > 1 ) {
        result = or.some((showIf) => this.calExpression(showIf, allQuestions));
      } else {
        result = and.every((showIf) => this.calExpression(showIf, allQuestions));
      }

      return result;
    },
    calExpression(showIf, allQuestions) {
      if ( showIf.includes('!=')) {
        return this.isNotEqual(showIf, allQuestions);
      } else {
        return this.isEqual(showIf, allQuestions);
      }
    },
    isEqual(showIf, allQuestions) {
      showIf = showIf.trim();
      const variables = this.getVariables(showIf, '=');

      if ( variables ) {
        const left = this.stringifyAnswer(this.getAnswer(variables.left, allQuestions));
        const right = this.stringifyAnswer(variables.right);

        return left === right;
      }

      return false;
    },
    isNotEqual(showIf, allQuestions) {
      showIf = showIf.trim();
      const variables = this.getVariables(showIf, '!=');

      if ( variables ) {
        const left = this.stringifyAnswer(this.getAnswer(variables.left, allQuestions));
        const right = this.stringifyAnswer(variables.right);

        return left !== right;
      }

      return false;
    },
    getVariables(showIf, operator) {
      if ( showIf.includes(operator)) {
        const array = showIf.split(operator);

        if ( array.length === 2 ) {
          return {
            left:  array[0],
            right: array[1]
          };
        } else {
          return null;
        }
      }

      return null;
    },
    getAnswer(variable, questions) {
      const found = questions.find((q) => q.variable === variable);

      if ( found ) {
        // Equivalent to finding question.answer in Ember
        return get(this.value, found.variable);
      } else {
        return variable;
      }
    },
    stringifyAnswer(answer) {
      if ( answer === undefined || answer === null ) {
        return '';
      } else if ( typeof answer === 'string' ) {
        return answer;
      } else {
        return `${ answer }`;
      }
    },
    shouldShow(q, values) {
      let expr = q.if;

      if ( expr === undefined && q.show_if !== undefined ) {
        expr = migrate(q.show_if);
      }

      if ( expr ) {
        const shown = !!this.evalExpr(expr, values, q, this.allQuestions);

        return shown;
      }

      return true;
    },
    shouldShowSub(q, values) {
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
        return this.evalExpr(expr, values, q, this.allQuestions);
      }

      return true;
    }
  },
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    mode="relative"
  />
  <form v-else-if="asTabs">
    <Tab
      v-for="(g, i) in groups"
      :key="i"
      :name="g.name"
      :label="g.name"
      :weight="g.weight"
    >
      <div
        v-for="(q, j) in g.questions"
        :key="`${i}-${j}`"
        class="row question"
      >
        <div class="col span-12">
          <component
            :is="componentForQuestion(q)"
            :in-store="inStore"
            :question="q"
            :target-namespace="targetNamespace"
            :value="get(value, q.variable)"
            :disabled="disabled"
            :chart-name="chartName"
            :mode="mode"
            @update:value="update(q.variable, $event)"
          />
        </div>
      </div>
    </Tab>
  </form>
  <form v-else>
    <div
      v-for="(g, i) in groups"
      :key="i"
    >
      <h3 v-if="groups.length > 1">
        {{ g.label }}
      </h3>
      <div
        v-for="(q, j) in g.questions"
        :key="`${i}-${j}`"
        class="row question"
      >
        <div class="col span-12">
          <component
            :is="componentForQuestion(q)"
            :in-store="inStore"
            :question="q"
            :target-namespace="targetNamespace"
            :mode="mode"
            :value="get(value, q.variable)"
            :disabled="disabled"
            :chart-name="chartName"
            @update:value="update(q.variable, $event)"
          />
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
  .question {
    margin-top: 10px;

    &:first-child {
      margin-top: 0;
    }
  }
</style>
