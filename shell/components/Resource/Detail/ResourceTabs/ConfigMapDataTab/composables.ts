import { Props } from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/index.vue';
import { computed } from 'vue';
import { base64Decode } from '@shell/utils/crypto';

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

    // we define the binary as false so that the ui doesn't display the size of the binary instead of the actual data...
    Object.keys(binaryData).forEach((key) => {
      rows.push({
        key,
        value:  base64Decode(binaryData[key]),
        binary: false
      });
    });

    return rows;
  });

  return { rows: rows.value };
};
