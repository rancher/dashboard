
export function DSLRegistrationsPerProduct(store, prodName) {
  const parsedData = {};
  const typeMapData = store._state.data['type-map'];

  const relevantKeys = [
    'basicGroupWeights',
    'basicTypeWeights',
    'groupDefaultTypes',
    'groupLabels',
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
    if (dataType === 'typeOptions') {
      const allTypeOptions = Object.values(typeMapData[dataType]).flat();
      const filtered = allTypeOptions.filter((item) => item.customRoute && item.customRoute.name.includes(prodName));

      if (filtered.length > 0) {
        parsedData['configureType'] = filtered;
      }
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

  console.error(`*** PRODUCT DATA DEBUGGER ${ prodName } **** DSLRegistrationsPerProduct`, parsedData); // eslint-disable-line no-console
}

export function registeredRoutes(store, prodName) {
  const routes = store.$router.getRoutes();

  const parsedData = routes.filter((route) => route.path.includes(prodName));

  console.error(`*** PRODUCT DATA DEBUGGER ${ prodName } **** registeredRoutes`, parsedData); // eslint-disable-line no-console
}
