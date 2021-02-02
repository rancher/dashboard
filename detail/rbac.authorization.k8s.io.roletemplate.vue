<script>
import CruResource from '@/components/CruResource';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import { SUBTYPE_MAPPING, VERBS } from '@/models/rbac.authorization.k8s.io.roletemplate';
import SortableTable from '@/components/SortableTable';
import { ucFirst } from '@/utils/string';

export default {
  components: {
    CruResource,
    NameNsDescription,
    SortableTable,
  },

  mixins: [CreateEditView],

  data() {
    const subtypes = Object.values(SUBTYPE_MAPPING).map(mapping => ({
      ...mapping,
      label:       this.t(mapping.labelKey),
      bannerAbbrv: this.t(mapping.bannerAbbrvKey)
    }));

    this.$set(this.value, 'rules', this.value.rules || []);
    this.$set(this.value, 'roleTemplateIds', this.value.roleTemplateIds || []);
    this.$set(this.value, 'newUserDefault', !!this.value.newUserDefault);
    this.$set(this.value, 'locked', !!this.value.locked);

    const currentSubtype = subtypes.find(subtype => subtype.id === this.value.subtype)?.key;

    this.$nextTick(() => {
      if (currentSubtype) {
        this.selectType(currentSubtype);
      }
    });

    return { subtypes };
  },
  computed: {
    isRancherSubtype() {
      return this.value.subtype !== SUBTYPE_MAPPING.GLOBAL.key;
    },
    rules() {
      return this.value.rules.map((rule, i) => {
        const tableRule = {
          index:           i,
          apiGroups:       rule.apiGroups || [],
          resources:       rule.resources || [],
          nonResourceURLs: rule.nonResourceURLs || []
        };

        VERBS.forEach((verb) => {
          const key = this.verbKey(verb);

          tableRule[key] = rule.verbs[0] === '*' || rule.verbs.includes(verb);
          tableRule.hasCustomVerbs = rule.verbs.some(verb => !VERBS.includes(verb));
        });

        return tableRule;
      });
    },
    ruleHeaders() {
      const verbHeaders = VERBS.map(verb => ({
        name:      verb,
        key:       ucFirst(verb),
        value:     this.verbKey(verb),
        formatter: 'Checked',
        align:     'center'
      }));

      return [
        ...verbHeaders,
        {
          name:      'custom',
          labelKey:  'tableHeaders.customVerbs',
          key:       ucFirst('custom'),
          value:     'hasCustomVerbs',
          formatter: 'Checked',
          align:     'center'
        },
        {
          name:      'resources',
          labelKey:  'tableHeaders.resources',
          value:     'resources',
          formatter: 'list',
        },
        {
          name:      'url',
          labelKey:  'tableHeaders.url',
          value:     'nonResourceURLs',
          formatter: 'list',
        },
        {
          name:      'apiGroups',
          labelKey:  'tableHeaders.apiGroup',
          value:     'apiGroups',
          formatter: 'list',
        }
      ];
    }
  },
  methods: {
    selectType(type) {
      this.value.updateSubtype(type);

      this.$emit('set-subtype', this.subtypes.find(subtype => subtype.id === type).label);
    },

    verbKey(verb) {
      return `has${ ucFirst(verb) }`;
    }
  }
};
</script>

<template>
  <CruResource
    class="receiver"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :selected-subtype="value.subtype"
    :subtypes="subtypes"
    :errors="errors"
    @select-type="selectType"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-model="value"
      :namespaced="false"
      :mode="mode"
      label="Name"
    />
    <SortableTable
      key-field="index"
      :rows="rules"
      :headers="ruleHeaders"
      :table-actions="false"
      :row-actions="false"
      :search="false"
    />
  </CruResource>
</template>

<style lang="scss" scoped>
  ::v-deep {
    .column-headers {
      margin-right: 75px;
    }

    .columns > .col > * {
      min-height: $input-height;
    }

  }
</style>
