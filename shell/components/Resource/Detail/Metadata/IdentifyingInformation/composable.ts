import { useI18n } from '@shell/composables/useI18n';
import { computed, ComputedRef, markRaw, toValue } from 'vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import LinkName from '@shell/components/formatter/LinkName.vue';
import Additional from '@shell/components/Resource/Detail/Additional.vue';
import { useStore } from 'vuex';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import IconText from '@shell/components/formatter/IconText.vue';
import { NODE } from '@shell/config/types';
import day from 'dayjs';
import { Row } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';

export const useContainerRuntime = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('node.detail.detailTop.containerRuntime'),
    valueOverride: {
      component: markRaw(IconText),
      props:     { value: resourceValue.containerRuntimeVersion, iconClass: resourceValue.containerRuntimeIcon }
    },
    value: resourceValue.containerRuntimeVersion
  }));
};

export const useExternalIp = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('node.detail.detailTop.externalIP'),
    valueOverride: {
      component: markRaw(CopyToClipboardText),
      props:     { text: resourceValue.externalIp }
    },
    value: resourceValue.externalIp
  }));
};

export const usePodIp = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label: i18n.t('workload.detailTop.podIP'),
    value: resourceValue.status.podIP
  }));
};

export const useWorkload = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('workload.detailTop.workload'),
    valueOverride: {
      component: markRaw(LinkName),
      props:     {
        type:      resourceValue.workloadRef.type,
        value:     resourceValue.workloadRef.name,
        namespace: resourceValue.workloadRef.namespace
      }
    },
    value: resourceValue.workloadRef.name
  }));
};

export const useNode = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('workload.detailTop.node'),
    valueOverride: {
      component: markRaw(LinkName),
      props:     { type: NODE, value: resourceValue.spec.nodeName }
    },
    value: resourceValue.spec.nodeName
  }));
};

export const useStarted = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('workload.detailTop.started'),
    valueOverride: {
      component: markRaw(LiveDate),
      props:     { addSuffix: true, value: resourceValue.status.startTime }
    },
    value: resourceValue.spec.nodeName
  }));
};

export const useDuration = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  const FACTORS = [60, 60, 24];
  const LABELS = ['sec', 'min', 'hour', 'day'];
  const value = computed(() => {
    const { completionTime, startTime } = resourceValue.status;
    const end = day(completionTime);
    const start = day(startTime);
    let diff = end.diff(start) / 1000;

    let label: any;

    let i = 0;

    while (diff >= FACTORS[i] && i < FACTORS.length) {
      diff /= FACTORS[i];
      i++;
    }

    if (diff < 5) {
      label = Math.floor(diff * 10) / 10;
    } else {
      label = Math.floor(diff);
    }

    label += ` ${ i18n.t(`unit.${ LABELS[i] }`, { count: label }) } `;
    label = label.trim();

    return label;
  });

  return computed(() => ({
    label:         i18n.t('workload.detailTop.duration'),
    valueOverride: {
      component: markRaw(LiveDate),
      props:     { value: value.value }
    },
    value: value.value
  }));
};

export const useImage = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('component.resource.detail.metadata.identifyingInformation.image'),
    value:         resourceValue.imageNames,
    valueOverride: {
      component: markRaw(Additional),
      props:     { items: resourceValue.imageNames }
    },
  }));
};

export const useReady = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label: i18n.t('component.resource.detail.metadata.identifyingInformation.ready'),
    value: resourceValue.ready,
  }));
};

export const useRestarts = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label: i18n.t('workload.detailTop.podRestarts'),
    value: resourceValue.restartCount
  }));
};

export const useInternalIp = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('node.detail.detailTop.internalIP'),
    valueOverride: {
      component: markRaw(CopyToClipboardText),
      props:     { text: resourceValue.internalIp }
    },
    value: resourceValue.internalIp
  }));
};

export const useVersion = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label: i18n.t('node.detail.detailTop.version'),
    value: resourceValue.version
  }));
};

export const useOs = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label: i18n.t('node.detail.detailTop.os'),
    value: resourceValue.status.nodeInfo.osImage
  }));
};

export const useLiveDate = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => ({
    label:         i18n.t('component.resource.detail.metadata.identifyingInformation.age'),
    valueOverride: {
      component: markRaw(LiveDate),
      props:     { value: resourceValue.creationTimestamp }
    },
    value: resourceValue.age,
  }));
};

export const useProject = (resource: any): ComputedRef<Row> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => {
    return {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.project'),
      value: resourceValue.project?.nameDisplay,
      to:    resourceValue.project?.detailLocation
    };
  });
};

export const useDefaultIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);
  const liveDate = useLiveDate(resource);

  return computed(() => [
    {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.namespace'),
      value: resourceValue.namespace,
    },
    liveDate.value
  ]);
};

export const useDefaultWorkloadIdentifyingInformation = (resource: any): ComputedRef<Row[]> => {
  const store = useStore();
  const i18n = useI18n(store);

  const resourceValue = toValue(resource);

  return computed(() => [
    useImage(resource).value,
    useReady(resource).value,
    {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.up-to-date'),
      value: resourceValue.upToDate,
    },
    {
      label: i18n.t('component.resource.detail.metadata.identifyingInformation.available'),
      value: resourceValue.available,
    },
  ]);
};
