import SYSTEM_NAMESPACES from '@/config/system-namespaces';

export default {
  isSystem() {
    return SYSTEM_NAMESPACES.includes(this.metadata.name);
  }
};
