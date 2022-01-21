// This plugin loads any plugins at app load time

import { allHash } from '@shell/utils/promise';

const META_NAME_PREFIX = 'app-autoload-';

export default async(context) => {
  const meta = context.app?.head?.meta || [];
  const hash = {};

  meta.forEach((m) => {
    const metaName = m.name || '';

    if (metaName.indexOf(META_NAME_PREFIX) === 0) {
      const name = metaName.substr(META_NAME_PREFIX.length);

      hash[name] = context.$plugin.loadAsync(name, m.content);
    }
  });

  await allHash(hash);
};
