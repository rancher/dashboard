import Identicon from 'identicon.js';
import { md5 } from '@/utils/crypto';

export default {
  avatarSrc() {
    if ( this.provider === 'github' ) {
      return this.profilePicture;
    } else {
      let id = this.id || 'Unknown';

      id = id.replace(/[^:]+:\/\//, '');

      const hash = md5(id, 'hex');
      const out = `data:image/png;base64,${ new Identicon(hash, 80, 0.01).toString() }`;

      return out;
    }
  }
};
