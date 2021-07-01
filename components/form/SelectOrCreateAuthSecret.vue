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
const _AWS = '_aws';

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

    allowAws: {
      type:    Boolean,
      default: false,
    },

    registerBeforeHook: {
      type:     Function,
      required: true,
    },

    hookName: {
      type:    String,
      default: 'registerAuthSecret'
    },

    vertical: {
      type:    Boolean,
      default: false,
    },
  },

  async fetch() {
    // Avoid an async call and loading screen if already loaded by someone else
    if ( this.$store.getters[`${ this.inStore }/haveAll`](SECRET) ) {
      this.allSecrets = this.$store.getters[`${ this.inStore }/all`](SECRET);
    } else {
      this.allSecrets = await this.$store.dispatch(`${ this.inStore }/findAll`, { type: SECRET });
    }

    let selected = _NONE;

    if ( this.value ) {
      if ( typeof this.value === 'object' ) {
        selected = `${ this.value.namespace }/${ this.value.name }`;
      } else if ( this.value.includes('/') ) {
        selected = this.value;
      } else if ( this.namespace ) {
        selected = `${ this.namespace }/${ this.value }`;
      } else {
        selected = this.value;
      }
    }

    this.selected = selected;

    this.update();
  },

  data() {
    return {
      allSecrets: null,
      selected:   null,

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

    _AWS() {
      return _AWS;
    },

    options() {
      const types = [];
      const keys = [];

      if ( this.allowSsh ) {
        types.push(SECRET_TYPES.SSH);
      }

      if ( this.allowBasic ) {
        types.push(SECRET_TYPES.BASIC);
      }

      if ( this.allowAws ) {
        keys.push('accessKey');
        keys.push('secretKey');
      }

      const out = this.allSecrets
        .filter(x => this.namespace && this.limitToNamespace ? x.metadata.namespace === this.namespace : true)
        .filter((x) => {
          // Must match one of the types if given
          if ( types.length && !types.includes(x._type) ) {
            return false;
          }

          // Must match ALL of the keys if given
          if ( keys.length ) {
            const dataKeys = Object.keys(x.data || {});

            if ( !keys.every(key => dataKeys.includes(key)) ) {
              return false;
            }

            return true;
          }
        }).map((x) => {
          return {
            label: `${ x.metadata.name } (${ x.subTypeDisplay })`,
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
          value: _SSH,
        });
      }

      if ( this.allowAws ) {
        out.unshift({
          label: this.t('selectOrCreateAuthSecret.createAws'),
          value: _AWS,
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
      if ( this.vertical ) {
        return '';
      }

      if ( this.selected === _SSH || this.selected === _BASIC || this.selected === _AWS ) {
        return 'col span-4';
      }

      return 'col span-6';
    },

    moreCols() {
      if ( this.vertical ) {
        return 'mt-20';
      }

      return 'col span-4';
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
      this.registerBeforeHook(this.doCreate, this.hookName);
    } else {
      throw new Error('Before Hook is missing');
    }
  },

  methods: {
    update() {
      if ( !this.selected || [_SSH, _BASIC, _AWS, _NONE].includes(this.selected) ) {
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
      if ( ![_SSH, _BASIC, _AWS].includes(this.selected) ) {
        return;
      }

      const secret = await this.$store.dispatch(`${ this.inStore }/create`, {
        type:     SECRET,
        metadata: {
          namespace:    this.namespace,
          generateName: this.generateName
        },
      });

      let type, publicField, privateField;

      switch ( this.selected ) {
      case _SSH:
        type = SECRET_TYPES.SSH;
        publicField = 'ssh-publickey';
        privateField = 'ssh-privatekey';
        break;
      case _BASIC:
        type = SECRET_TYPES.BASIC;
        publicField = 'username';
        privateField = 'password';
        break;
      case _AWS:
        type = SECRET_TYPES.OPAQUE;
        publicField = 'accessKey';
        privateField = 'secretKey';
        break;
      default:
        throw new Error('Uknown type');
      }

      secret._type = type;
      secret.data = {
        [publicField]:  base64Encode(this.publicKey),
        [privateField]: base64Encode(this.privateKey),
      };

      await secret.save();

      this.$nextTick(() => {
        this.selected = secret.id;
      });
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="select-or-create-auth-secret">
    <div class="mt-20" :class="{'row': !vertical}">
      <div :class="firstCol">
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
        <div :class="moreCols">
          <LabeledInput v-model="publicKey" type="multiline" label-key="selectOrCreateAuthSecret.ssh.publicKey" />
        </div>
        <div :class="moreCols">
          <LabeledInput v-model="privateKey" type="multiline" label-key="selectOrCreateAuthSecret.ssh.privateKey" />
        </div>
      </template>
      <template v-else-if="selected === _BASIC">
        <div :class="moreCols">
          <LabeledInput v-model="publicKey" label-key="selectOrCreateAuthSecret.basic.username" />
        </div>
        <div :class="moreCols">
          <LabeledInput v-model="privateKey" type="password" label-key="selectOrCreateAuthSecret.basic.password" />
        </div>
      </template>
      <template v-else-if="selected === _AWS">
        <div :class="moreCols">
          <LabeledInput v-model="publicKey" label-key="selectOrCreateAuthSecret.aws.accessKey" />
        </div>
        <div :class="moreCols">
          <LabeledInput v-model="privateKey" type="password" label-key="selectOrCreateAuthSecret.aws.secretKey" />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.select-or-create-auth-secret div.labeled-select {
  min-height: 61px;
}
</style>
