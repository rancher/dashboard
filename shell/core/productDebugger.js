
export function DSLRegistrationsPerProduct(store, prodName) {
  // console.error('*** PRODUCT DATA DEBUGGER **** DSLRegistrationsPerProduct for product:', store._state.data);
  const parsedData = {};
  const typeMapData = store._state.data['type-map'];

  const relevantKeys = [
    'basicGroupWeights',
    'basicTypeWeights',
    'groupDefaultTypes',
    // 'headers',
    // 'spoofedTypes',
    // 'typeOptions',
    // 'typeWeights'
  ];

  Object.keys(typeMapData).forEach((dataType) => {
    // prod reg
    if (dataType === 'products' && typeMapData[dataType].filter((item) => item.name === prodName)) {
      parsedData[dataType] = typeMapData[dataType].filter((item) => item.name === prodName);
    }

    // prod configureType
    if (dataType === 'typeOptions' && typeMapData[dataType].filter((item) => item.customRoute && item.customRoute.name.includes(prodName))) {
      parsedData['configureType'] = typeMapData[dataType].filter((item) => item.customRoute && item.customRoute.name.includes(prodName));
    }

    // other types which map with prodName
    if (typeMapData[dataType]?.[prodName]) {
      parsedData[dataType] = typeMapData[dataType]?.[prodName];
    }

    // other relevant data
    if (relevantKeys.includes(dataType)) {
      parsedData[dataType] = typeMapData[dataType];
    }
  });

  console.error('*** PRODUCT DATA DEBUGGER **** DSLRegistrationsPerProduct', parsedData);
}

export function registeredRoutes(store, prodName) {
  const routes = store.$router.getRoutes();

  const parsedData = routes.filter((route) => route.path.includes(prodName));

  console.error('*** PRODUCT DATA DEBUGGER **** registeredRoutes', parsedData);
}
