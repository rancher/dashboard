import { DSL } from '@/store/type-map';

export const NAME = 'bridle';
export const CHART_NAME = 'bridle';

export function init(store) {
    const { product, basicType, virtualType } = DSL(store, 'bridle');
  
    /*
    const {
      ENGINES,
      ENGINE_IMAGES,
      NODES,
      REPLICAS,
      SETTINGS,
      VOLUMES,
    } = bridle;
  */
  
    product({
      ifHaveGroup: 'bridle.io',
      icon:        'bridle'
    });
  
    virtualType({
      label:      'Overview',
      group:      'Root',
      namespaced: false,
      name:       'bridle-overview',
      weight:     105,
      route:      { name: 'c-cluster-bridle' },
      exact:      true
    });
  
    basicType('bridle-overview');
  
    /*
    basicType([
      ENGINES,
      ENGINE_IMAGES,
      NODES,
      REPLICAS,
      SETTINGS,
      VOLUMES,
    ]);
  */
  }
  