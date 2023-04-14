import { get } from '@shell/utils/object';
import { shortenedImage } from '@shell/utils/string';
import { WORKLOAD_TYPES } from '@shell/config/types';

export const fields = {
  imageNames: (resource) => {
    let containers;
    const images = [];

    if (resource.type === WORKLOAD_TYPES.CRON_JOB) {
      containers = get(resource, 'spec.jobTemplate.spec.template.spec.containers');
    } else {
      containers = get(resource, 'spec.template.spec.containers');
    }
    if (containers) {
      containers.forEach((container) => {
        if (!images.includes(container.image)) {
          images.push(container.image);
        }
      });
    }

    return images.map(shortenedImage);
  }
};

export const calculatedFields = [
  { name: fields.imageNames.name, func: fields.imageNames }
];
