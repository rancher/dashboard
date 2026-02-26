export const RETENTION_DEFAULT = 5;
export const RKE2_INGRESS_NGINX = 'rke2-ingress-nginx';
export const RKE2_TRAEFIK = 'rke2-traefik';
export const INGRESS_NGINX = 'ingress-nginx';
export const INGRESS_CONTROLLER = 'ingress-controller';
export const TRAEFIK = 'traefik';
export const HARVESTER = 'harvester';
export const INGRESS_DUAL = 'dual';
export const INGRESS_NONE = 'none';
export const INGRESS_OPTIONS = [
  {
    id:        TRAEFIK,
    image:     { src: require('@shell/assets/images/providers/traefik.png'), alt: 'Traefik' },
    header:    { title: { key: 'cluster.ingress.traefik.header' } },
    subHeader: { label: { key: 'cluster.ingress.recommended' } },
    content:   { key: 'cluster.ingress.traefik.content' },
    doc:       { url: 'https://docs.rke2.io/networking/networking_services?_highlight=ingress#ingress-controller' }
  },
  {
    id:        INGRESS_NGINX,
    image:     { src: require('@shell/assets/images/providers/kubernetes.svg'), alt: 'NGINX' },
    header:    { title: { key: 'cluster.ingress.nginx.header' } },
    subHeader: { label: { key: 'cluster.ingress.legacy' } },
    content:   { key: 'cluster.ingress.nginx.content' },
    doc:       { url: 'https://www.kubernetes.dev/blog/2025/11/12/ingress-nginx-retirement/' }
  },
  {
    id:        INGRESS_DUAL,
    header:    { title: { key: 'cluster.ingress.dual.header' } },
    subHeader: { label: { key: 'cluster.ingress.migration' } },
    content:   { key: 'cluster.ingress.dual.content' }
  }
];

export const INGRESS_MIGRATION_KB_LINK = 'https://support.scc.suse.com/s/kb/How-to-migrate-the-Rancher-Ingress-to-Traefik-in-an-RKE2-cluster';
export const INGRESS_CLASS_DEFAULT = 'nginx';
export const INGRESS_CONTROLLER_CLASS_DEFAULT = 'k8s.io/ingress-nginx';
export const INGRESS_CLASS_MIGRATION = 'rke2-ingress-nginx-migration';
export const INGRESS_CONTROLLER_CLASS_MIGRATION = 'rke2.cattle.io/ingress-nginx-migration';
