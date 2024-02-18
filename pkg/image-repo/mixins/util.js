import day from 'dayjs';
import { diffFrom } from '@shell/utils/time';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';

export default {
  methods: {
    timeFormatStr() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return `${ dateFormat }, ${ timeFormat }`;
    },
    liveUpdate(creationTime) {
      if (!creationTime) {
        return '-';
      }
      const now = day();
      const createdDate = day(creationTime);
      const revisionAgeObject = diffFrom(createdDate, now, this.t);

      return revisionAgeObject.string;
    },
    getTotalCount(resp) {
      const count = resp?._headers && resp?._headers['x-total-count'];

      return count ? parseInt(count, 10) : 0;
    },
    changeToBytes(size, unit) {
      const u = unit?.toUpperCase();

      if (u === 'MB') {
        return size * 1024 * 1024;
      } else if (u === 'GB') {
        return size * 1024 * 1024 * 1024;
      } else if ( u === 'TB') {
        return size * 1024 * 1024 * 1024 * 1024;
      } else {
        return -1;
      }
    },
  },
};
