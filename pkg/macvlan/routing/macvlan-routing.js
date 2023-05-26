import { MACVLAN_PRODUCT_NAME, MACVLAN_IP_PRODUCT_NAME } from '../config/macvlan-types';
import MacvlanResourceIps from '../pages/macvlanIp.vue';
import InstallView from '../components/InstallView.vue';

const routes = [
  {
    name:      `${ MACVLAN_PRODUCT_NAME }-c-cluster-resource-install`,
    path:      '/c/:cluster/:product/:resource/install',
    component: InstallView
  },
  {
    name:      `${ MACVLAN_IP_PRODUCT_NAME }-c-cluster-resource-ip`,
    path:      `/c/:cluster/:product/:resource/ip/:id`,
    component: MacvlanResourceIps,
  },
];

export default routes;
