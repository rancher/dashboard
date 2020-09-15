import { CIS } from '@/config/types';
import { downloadFile } from '@/utils/download';
import { colorForState } from '@/plugins/steve/resource-instance';

export default {
  availableActions() {
    const out = this._standardActions;
    const downloadLogs = {
      action:     'downloadReport',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'Download Report',
      total:      1,
    };

    out.push(downloadLogs);

    return out;
  },

  downloadReport() {
    return async() => {
      const owned = await this.getOwned();
      const reportCRD = owned.filter(each => each.type === CIS.REPORT)[0];
      const JSON = reportCRD?.spec?.reportJSON;

      downloadFile(`${ reportCRD.id }.json`, JSON, 'application/json');
    };
  },

  testState() {
    return (state) => {
      const color = colorForState.call(this, this.state);

      const bgColor = this.color.replace('text-', 'bg-');

      return { color, bgColor };
    };
  },
};
