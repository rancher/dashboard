<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretItem from '@pkg/components/VolumesTab/Secret/SecretItem';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'Secret',
  components: {
    ArrayListGrouped,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    SecretItem,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    showDefaultMode: {
      type:    Boolean,
      default: true
    },
  },
  data() {
    const { items = [] } = this.value;

    const secretItems = items.map((item) => {
      const secretItem = this.clone(item);

      secretItem._id = randomStr(4);

      return secretItem;
    });

    return {
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata?.namespace,
      allSecrets:      {},
      secrets:         [],
      secretItems,
    };
  },
  async fetch() {
    const requests = { secrets: this.$store.dispatch('management/findAll', { type: SECRET }) };

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    this.fetchInProgress = false;
  },
  computed: {
    showItemRemoveButton() {
      return !this.isView && this.secretItems.length > 0;
    }
  },
  methods: {
    update() {
      const items = [];

      this.secretItems.forEach((secretItem) => {
        const item = this.clone(secretItem);

        delete secretItem._id;

        items.push(item);
      });

      this.setFieldIfNotEmpty('items', items);
    },
    getSecret() {
      const name = this.getField('name');

      return !this.fetchInProgress && name ? this.secrets.find(secret => secret.metadata.name === name) : {};
    },
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
        this.secret = {};
      }
    },
    addSecretItem() {
      this.secretItems.push({ _id: randomStr(4) });
    },
    removeSecretItem(index) {
      this.secretItems.splice(index, 1);
      this.queueUpdate();
    },
    updateSecretItem() {
      this.queueUpdate();
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <div v-if="fetchInProgress">
          <span />
        </div>
        <div v-else>
          <LabeledSelect
            :value="getField('name')"
            :mode="mode"
            :options="secrets"
            option-label="metadata.name"
            :reduce="secret => secret.metadata.name"
            :placeholder="getNotSetPlaceholder(value, 'name')"
            :label="t('verrazzano.common.fields.volumes.secret.name')"
            @input="setFieldIfNotEmpty('name', $event)"
          />
        </div>
      </div>
      <div v-if="showDefaultMode" class="col span-4">
        <LabeledInput
          :value="getField('defaultMode')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'defaultMode')"
          :label="t('verrazzano.common.fields.volumes.secret.defaultMode')"
          @input="setFieldIfNotEmpty('defaultMode', $event)"
        />
      </div>
      <div class="col span-4">
        <Checkbox
          :value="getField('optional')"
          :mode="mode"
          :label="t('verrazzano.common.fields.volumes.secret.optional')"
          @input="setBooleanField('optional', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div>
      <ArrayListGrouped
        v-model="secretItems"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.common.buttons.addSecretItem')"
        @add="addSecretItem()"
      >
        <template #remove-button="removeProps">
          <button
            v-if="showItemRemoveButton"
            type="button"
            class="btn role-link close btn-sm"
            @click="removeSecretItem(removeProps.i)"
          >
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else />
        </template>
        <template #default="props">
          <div class="spacer-small" />
          <SecretItem
            v-model="props.row.value"
            :secret="getSecret()"
            :mode="mode"
            @input="updateSecretItem()"
          />
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style scoped>

</style>
