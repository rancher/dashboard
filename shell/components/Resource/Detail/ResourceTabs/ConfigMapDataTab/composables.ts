import { Props } from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/index.vue';
import { computed } from 'vue';
import { base64Decode } from '@shell/utils/crypto';
import { asciiLike } from '@shell/utils/string';

export const useGetConfigMapDataTabProps = (configMap: any): Props => {
  const rows = computed(() => {
    const rows: any[] = [];
    const { data = {}, binaryData = {} } = configMap;

    Object.keys(data).forEach((key) => {
      rows.push({
        key,
        value:  data[key],
        binary: false
      });
    });

    // binaryData is base64-encoded per the Kubernetes ConfigMap spec. If it decodes to
    // readable text, show the decoded content; otherwise flag it as binary so DetailText
    // renders the size placeholder instead of unreadable bytes.
    Object.keys(binaryData).forEach((key) => {
      const rawValue = binaryData[key];
      const decoded = base64Decode(rawValue);
      const isAscii = asciiLike(decoded);

      rows.push({
        key,
        value:  isAscii ? decoded : rawValue,
        binary: !isAscii
      });
    });

    return rows;
  });

  return { rows: rows.value };
};
