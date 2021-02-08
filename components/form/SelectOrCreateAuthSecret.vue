<script>
import { _EDIT } from '@/config/query-params';
import Loading from '@/components/Loading';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { SECRET } from '@/config/types';
import { TYPES as SECRET_TYPES } from '@/models/secret';
import { base64Encode } from '@/utils/crypto';
import { insertAt } from '@/utils/array';
import { sortBy } from '@/utils/sort';

const _NONE = '_none';
const _BASIC = '_basic';
const _SSH = '_ssh';

export default {
  components: {
    Loading,
    LabeledInput,
    LabeledSelect,
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },

    value: {
      type:    [String, Object],
      default: null,
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    labelKey: {
      type:    String,
      default: 'selectOrCreateAuthSecret.label',
    },

    namespace: {
      type:     String,
      required: true,
    },

    limitToNamespace: {
      type:    Boolean,
      default: true,
    },

    generateName: {
      type:    String,
      default: 'auth-',
    },

    allowNone: {
      type:    Boolean,
      default: true,
    },

    allowSsh: {
      type:    Boolean,
      default: true,
    },

    allowBasic: {
      type:    Boolean,
      default: true,
    },

    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },

  async fetch() {
    this.allSecrets = await this.$store.dispatch(`${ this.inStore }/findAll`, { type: SECRET });

    let selected = _NONE;

    if ( this.value && typeof this.value === 'object' ) {
      selected = `${ this.value.namespace }/${ this.value.name }`;
    } else if ( this.value ) {
      selected = this.value;
    }

    this.selected = selected;

    this.update();
  },

  data() {
    return {
      allSecrets: null,
      selected:   null,

      username:   '',
      password:   '',
      publicKey:  '',
      privateKey: '',
    };
  },

  computed: {
    _SSH() {
      return _SSH;
    },
    _BASIC() {
      return _BASIC;
    },

    options() {
      const types = [];

      if ( this.allowSsh ) {
        types.push(SECRET_TYPES.SSH);
      }

      if ( this.allowBasic ) {
        types.push(SECRET_TYPES.BASIC);
      }

      const out = this.allSecrets
        .filter(x => types.includes(x._type) )
        .filter(x => this.namespace && this.limitToNamespace ? x.metadata.namespace === this.namespace : true)
        .map((x) => {
          return {
            label: `${ x.metadata.name } (${ x.typeDisplay })`,
            group: x.metadata.namespace,
            value: x.id,
          };
        });

      if ( !this.limitToNamespace ) {
        sortBy(out, 'group');
        if ( out.length ) {
          let lastGroup = '';

          for ( let i = 0 ; i < out.length ; i++ ) {
            if ( out[i].group !== lastGroup ) {
              lastGroup = out[i].group;

              insertAt(out, i, {
                kind:     'title',
                label:    this.t('selectOrCreateAuthSecret.namespaceGroup', { name: lastGroup }),
                disabled: true,
              });

              i++;
            }
          }
        }
      }

      if ( out.length ) {
        out.unshift({
          kind:     'title',
          label:    this.t('selectOrCreateAuthSecret.chooseExisting'),
          disabled: true
        });
      }

      if ( this.allowSsh ) {
        out.unshift({
          label: this.t('selectOrCreateAuthSecret.createSsh'),
          value: '_ssh',
        });
      }

      if ( this.allowBasic ) {
        out.unshift({
          label: this.t('selectOrCreateAuthSecret.createBasic'),
          value: _BASIC,
        });
      }

      if ( this.allowNone ) {
        out.unshift({
          label: this.t('generic.none'),
          value: _NONE,
        });
      }

      return out;
    },

    firstCol() {
      if ( this.selected === _SSH || this.selected === _BASIC ) {
        return 'span-4';
      }

      return 'span-6';
    }
  },

  watch: {
    selected: 'update',

    namespace(ns) {
      if ( ns && !this.selected.startsWith(`${ ns }/`) ) {
        this.selected = _NONE;
      }
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.doCreate, 'createAuthSecret');
    }
  },

  methods: {
    update() {
      if ( !this.selected || this.selected === _SSH || this.selected === _BASIC || this.selected === _NONE ) {
        this.$emit('input', null);
      } else {
        const split = this.selected.split('/');

        if ( this.limitToNamespace ) {
          this.$emit('input', split[1]);
        } else {
          const out = {
            namespace: split[0],
            name:      split[1]
          };

          this.$emit('input', out);
        }
      }
    },

    async doCreate() {
      if ( this.selected === _SSH || this.selected === _BASIC ) {
        const secret = await this.$store.dispatch(`${ this.inStore }/create`, {
          type:     SECRET,
          metadata: {
            namespace:    this.namespace,
            generateName: this.generateName
          },
        });

        if ( this.selected === _SSH ) {
          secret._type = SECRET_TYPES.SSH;
          secret.data = {
            'ssh-publickey':  base64Encode(this.publicKey),
            'ssh-privatekey': base64Encode(this.privateKey),
          };
        } else {
          secret._type = SECRET_TYPES.BASIC;
          secret.data = {
            username:  base64Encode(this.username),
            password: base64Encode(this.password),
          };
        }

        await secret.save();

        this.$nextTick(() => {
          this.selected = secret.id;
        });
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row mt-20">
      <div class="col" :class="{[firstCol]: true}">
        <LabeledSelect
          v-model="selected"
          :mode="mode"
          :label-key="labelKey"
          :options="options"
          :selectable="option => !option.disabled"
        >
          <template v-slot:option="opt">
            <template v-if="opt.kind === 'divider'">
              <hr />
            </template>
            <template v-else-if="opt.kind === 'title'">
              {{ opt.label }}
            </template>
            <template v-else>
              {{ opt.label }}
            </template>
          </template>
        </LabeledSelect>
      </div>
      <template v-if="selected === _SSH">
        <div class="col span-4">
          <LabeledInput v-model="publicKey" type="multiline" label-key="selectOrCreateAuthSecret.ssh.publicKey" />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="privateKey" type="multiline" label-key="selectOrCreateAuthSecret.ssh.privateKey" />
        </div>
      </template>
      <template v-else-if="selected === _BASIC">
        <div class="col span-4">
          <LabeledInput v-model="username" label-key="selectOrCreateAuthSecret.basic.username" />
        </div>
        <div class="col span-4">
          <LabeledInput v-model="password" type="password" label-key="selectOrCreateAuthSecret.basic.password" />
        </div>
      </template>
    </div>
  </div>
</template>
