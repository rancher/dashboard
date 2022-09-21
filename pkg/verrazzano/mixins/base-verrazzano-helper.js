// Added by Verrazzano
import CreateEditView from '@shell/mixins/create-edit-view';
import NavigationHelper from '@pkg/mixins/navigation-helper';
import NotSetPlaceholder from '@pkg/mixins/not-set-placeholder';

import { clone, get, isEmpty, set } from '@shell/utils/object';
import { mapGetters } from 'vuex';

export default {
  mixins:   [CreateEditView, NotSetPlaceholder, NavigationHelper],
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    dnsPolicyOptions() {
      return [
        { value: 'ClusterFirst', label: this.t('verrazzano.common.types.dnsPolicy.clusterFirst') },
        { value: 'ClusterFirstWithHostNet', label: this.t('verrazzano.common.types.dnsPolicy.clusterFirstWithHostNet') },
        { value: 'Default', label: this.t('verrazzano.common.types.dnsPolicy.default') },
        { value: 'None', label: this.t('verrazzano.common.types.dnsPolicy.none') },
      ];
    },
    externalTrafficPolicyOptions() {
      return [
        { value: 'Cluster', label: this.t('verrazzano.common.types.externalTrafficPolicy.cluster') },
        { value: 'Local', label: this.t('verrazzano.common.types.externalTrafficPolicy.local') },
      ];
    },
    imagePullPolicyOptions() {
      return [
        { value: 'Always', label: this.t('verrazzano.common.types.imagePullPolicy.always') },
        { value: 'IfNotPresent', label: this.t('verrazzano.common.types.imagePullPolicy.ifNotPresent') },
        { value: 'Never', label: this.t('verrazzano.common.types.imagePullPolicy.never') },
      ];
    },
    maxPortNumber() {
      return 65535;
    },
    minPortNumber() {
      return 1;
    },
    mountPropagationModeOptions() {
      return [
        { value: 'None', label: this.t('verrazzano.common.types.mountPropagationMode.none') },
        { value: 'HostToContainer', label: this.t('verrazzano.common.types.mountPropagationMode.hostToContainer') },
        { value: 'Bidirectional', label: this.t('verrazzano.common.types.mountPropagationMode.bidirectional') },
      ];
    },
    neverEmptyFieldNames() {
      return [
        'emptyDir',
        'medium',
      ];
    },
    preemptionPolicyOptions() {
      return [
        { value: 'PreemptLowerPriority', label: this.t('verrazzano.common.types.preemptionPolicy.preemptLowerPriority') },
        { value: 'Never', label: this.t('verrazzano.common.types.preemptionPolicy.never') },
      ];
    },
    protocolOptions() {
      return [
        { value: 'TCP', label: this.t('verrazzano.common.types.portProtocol.tcp') },
        { value: 'UDP', label: this.t('verrazzano.common.types.portProtocol.udp') },
        { value: 'SCTP', label: this.t('verrazzano.common.types.portProtocol.sctp') },
      ];
    },
    restartPolicyOptions() {
      return [
        { value: 'OnFailure', label: this.t('verrazzano.common.types.restartPolicy.onFailure') },
        { value: 'Always', label: this.t('verrazzano.common.types.restartPolicy.always') },
        { value: 'Never', label: this.t('verrazzano.common.types.restartPolicy.never') },
      ];
    },
    serviceIPFamiliesSingleStackOptions() {
      return [
        {
          value:     'IPv4',
          label:     this.t('verrazzano.common.types.ipFamily.ipv4'),
          realValue: ['IPv4']
        },
        {
          value:     'IPv6',
          label:     this.t('verrazzano.common.types.ipFamily.ipv6'),
          realValue: ['IPv6']
        },
      ];
    },
    serviceIPFamiliesDualStackOptions() {
      return [
        ...this.serviceIPFamiliesSingleStackOptions,
        {
          value:     'IPv4, IPv6',
          label:     this.t('verrazzano.common.types.ipFamily.ipv4ipv6'),
          realValue: ['IPv4', 'IPv6']
        },
        {
          value:     'IPv6, IPv4',
          label:     this.t('verrazzano.common.types.ipFamily.ipv6ipv4'),
          realValue: ['IPv6', 'IPv4']
        },
      ];
    },
    serviceIPFamilyPolicyOptions() {
      return [
        { value: 'SingleStack', label: this.t('verrazzano.common.types.ipFamilyPolicy.singleStack') },
        { value: 'PreferDualStack', label: this.t('verrazzano.common.types.ipFamilyPolicy.preferDualStack') },
        { value: 'RequireDualStack', label: this.t('verrazzano.common.types.ipFamilyPolicy.requireDualStack') },
      ];
    },
    serviceTypeOptions() {
      return [
        { value: 'ClusterIP', label: this.t('verrazzano.common.types.serviceTypes.clusterIP') },
        { value: 'NodePort', label: this.t('verrazzano.common.types.serviceTypes.nodePort') },
        { value: 'LoadBalancer', label: this.t('verrazzano.common.types.serviceTypes.loadBalancer') },
        { value: 'ExternalName', label: this.t('verrazzano.common.types.serviceTypes.externalName') },
      ];
    },
    sessionAffinityOptions() {
      return [
        { value: 'ClientIP', label: this.t('verrazzano.common.types.sessionAffinity.clientIP') },
        { value: 'None', label: this.t('verrazzano.common.types.sessionAffinity.none') },
      ];
    },
    configMapApiVersion() {
      return 'v1';
    },
    deploymentApiVersion() {
      return 'apps/v1';
    },
    serviceApiVersion() {
      return 'v1';
    },
    secretApiVersion() {
      return 'v1';
    },
    oamApplicationApiVersion() {
      return 'core.oam.dev/v1alpha2';
    },
    oamContainerizedWorkloadApiVersion() {
      return 'core.oam.dev/v1alpha2';
    },
    verrazzanoMultiClusterApplicationApiVersion() {
      return 'oam.verrazzano.io/v1alpha1';
    },
    verrazzanoComponentApiVersion() {
      return 'oam.verrazzano.io/v1alpha1';
    },
    manualScalerTraitApiVersion() {
      return 'core.oam.dev/v1alpha2';
    },
    ingressTraitApiVersion() {
      return 'oam.verrazzano.io/v1alpha1';
    },
    metricsTraitApiVersion() {
      return 'oam.verrazzano.io/v1alpha1';
    },
    loggingTraitApiVersion() {
      return 'oam.verrazzano.io/v1alpha1';
    },
  },
  methods: {
    clone,
    get,
    isEmpty,
    set,
    isEmptyValue(fieldName, neu) {
      let result;

      if (typeof neu === 'undefined' || neu === null) {
        result = true;
      } else if (typeof neu === 'string' && neu.length === 0) {
        result = !this.neverEmptyFieldNames.includes(fieldName);
      } else if (Array.isArray(neu)) {
        result = !this.neverEmptyFieldNames.includes(fieldName);

        if (result) {
          for (let i = 0; i < neu.length; i++) {
            result = this.isEmptyValue(`${ fieldName }-item-${ i }`, neu[i]);
            if (!result) {
              break;
            }
          }
        }
      } else if (typeof neu === 'object') {
        result = !this.neverEmptyFieldNames.includes(fieldName);

        if (result) {
          for (const [key, value] of Object.entries(neu)) {
            result = this.isEmptyValue(key, value);
            if (!result) {
              break;
            }
          }
        }
      } else {
        // any other scalar type that is not undefined or null is considered not empty.
        result = false;
      }

      return result;
    },
    getField(fieldName) {
      return this.get(this.value, fieldName);
    },
    getListField(fieldName) {
      return this.getField(fieldName) || [];
    },
    setField(fieldName, neu) {
      this.set(this.value, fieldName, neu);
      this.$emit('input', this.value);
    },
    setBooleanField(fieldName, neu) {
      let value;

      if (typeof neu === 'undefined' || neu === null) {
        value = neu;
      } else if (typeof neu === 'string' && neu === '') {
        value = undefined;
      } else {
        value = Boolean(neu);
      }

      this.set(this.value, fieldName, value);
      this.$emit('input', this.value);
    },
    setNumberField(fieldName, neu) {
      let value;

      if (typeof neu === 'undefined' || neu === null) {
        value = neu;
      } else if (typeof neu === 'string' && neu === '') {
        value = undefined;
      } else {
        value = Number(neu);
      }

      this.set(this.value, fieldName, value);
      this.$emit('input', this.value);
    },
    _clearObjectHierarchy(fieldName) {
      if (fieldName.includes('.')) {
        const parentFields = fieldName.split('.');
        let fieldToCheck = parentFields[0];

        for (let i = 0; i < parentFields.length - 1; i++) {
          const parent = this.getField(fieldToCheck);

          if (parent && this.isEmptyValue(fieldToCheck, parent)) {
            this.setField(fieldToCheck, undefined);
            break;
          } else {
            fieldToCheck += `.${ parentFields[i + 1] }`;
          }
        }
      }
    },
    setFieldIfNotEmpty(fieldName, neu) {
      let valueToSet = neu;

      if (this.isEmptyValue(fieldName, neu)) {
        valueToSet = undefined;
      }
      this.setField(fieldName, valueToSet);
      if (typeof valueToSet === 'undefined') {
        this._clearObjectHierarchy(fieldName);
      }
    },
    sortObjectsByNamespace(sourceCollection, targetObject, nameOnly = false) {
      sourceCollection.forEach((item) => {
        const namespace = item.metadata.namespace;

        if (!Array.isArray(targetObject[namespace])) {
          targetObject[namespace] = [];
        }

        if (nameOnly) {
          targetObject[namespace].push(item.metadata.name);
        } else {
          targetObject[namespace].push(item);
        }
      });
    },
    showListRemoveButton(fieldName) {
      return !this.isView && Array.isArray(this.getListField(fieldName)) && this.getListField(fieldName).length > 0;
    },
    showEmptyListMessage(fieldName) {
      return this.isView && Array.isArray(this.getListField(fieldName)) && this.getListField(fieldName).length === 0;
    },
    didNamedObjectReallyChange(neu, old) {
      const neuIsEmpty = this.isEmpty(neu);
      const oldIsEmpty = this.isEmpty(old);
      let changed = false;

      if (neuIsEmpty || oldIsEmpty) {
        changed = !(neuIsEmpty && oldIsEmpty);
      } else {
        changed = neu.metadata.name !== old.metadata.name;
      }

      return changed;
    },
    arraysAreEquivalent(a, b) {
      return a.length === b.length && a.every((v, i) => v === b[i]);
    }
  },
};
