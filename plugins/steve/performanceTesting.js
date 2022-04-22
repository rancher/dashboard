import day from 'dayjs';

// This code should not be included in a production build
// This allows you to simulate large numbers of resources

// Fake extra resources to simulate scale
const PERF_DATA = {
  node: {
    count:     800,
    statusRow: 2,
  },
  'apps.deployment': {
    count:     4000,
    statusRow: 5
  },
  pod: {
    count:     4000,
    statusRow: 10
  },
};

const DEFAULTS = {
  count:     1, // One copy of each resource
  statusRow: 0, // Don't add any status rows (0 = None, 1 = All, N = 1 out of N)
  custom:    null // Custom function that can modify each row = takes node and index - e.g. (node, index) => { node.metadata.state.error = true; }
};

export function perfLoadAll(type, data) {
  // console.log(`${ type }`);
  if (data.length === 0) {
    return data;
  }

  const n = data[0];

  if (!n.apiVersion) {
    return data;
  }

  let config = PERF_DATA[type];

  if (!config) {
    return data;
  }

  if (typeof config === 'number') {
    config = { count: config };
  }

  config = {
    ...DEFAULTS,
    ...config
  };

  return replicate(data, config);
}

function randNum(max) {
  return Math.floor(Math.random() * max);
}

function replicate(data, config) {
  if (data.length === 0) {
    return data;
  }

  // Pretend there are none of the resource type
  if (config.count === 0) {
    return [];
  }

  if (config.count <= data.length) {
    return data.slice(0, config.count);
  }

  const templates = [];
  let j = 0;

  data.forEach(d => templates.push(JSON.stringify(d)));

  const newData = [...data];

  // We already have the elemnts in data... just need to pad out
  const remaining = config.count - data.length;

  for (let i = 0; i < remaining; i++) {
    const newNode = JSON.parse(templates[j]);

    newNode.id = `${ newNode.id }_${ i }`;
    newNode.metadata.uid = `uid_${ i }_${ Math.random() * 1000 }`;
    newNode.metadata.name = `${ newNode.metadata?.name }_${ i }`;
    newNode.metadata.creationTimestamp = day().format();
    newData.push(newNode);

    if (config.statusRow > 0) {
      // Fake a status row one in N times, where N is the statusRow setting
      const addStatusRow = config.statusRow === 1 ? true : randNum(config.statusRow) === 0;

      if (addStatusRow) {
        newNode.metadata.state = newNode.metadata.state || {};
        const isError = randNum(2) === 0;

        if (isError) {
          newNode.metadata.state.error = true;
        } else {
          newNode.metadata.state.transitioning = true;
        }
        newNode.metadata.state.message = `Test state description for ${ newNode.metadata.name }`;
      }
    }

    if (config.custom) {
      config.custom(newNode, i);
    }

    j++;
    if (j === templates.length) {
      j = 0;
    }
  }

  return newData;
}
