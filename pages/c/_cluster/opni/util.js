export function formatForTimeseries(data) {
  const out = {};

  data.forEach((entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      const label = this.$store.getters['i18n/withFallback'](`opni.chart.labels.${ key }`, { count: 1 }, key);

      if (!out[label]) {
        out[label] = { data: [value] };
      } else {
        out[label].data.push(value);
      }
    });
  });

  return out;
}

export function findBucket(log, timestamps) {
  const logTime = log.timestamp;

  let out;

  let i = 0;

  while (out === undefined) {
    const thisTime = timestamps[i];
    const nextTime = timestamps[i + 1];

    if (!thisTime) {
      out = null;
    }

    if (logTime >= thisTime && logTime < nextTime) {
      out = thisTime;
    } else {
      i++;
    }
  }

  return out;
}

// TODO table multi-select
export function showTooltip(chartName, logs = []) {
  const log = logs[0];
  const chartComp = this.$refs[chartName];

  if (!chartComp) {
    return;
  }
  if (!log) {
    chartComp.hideTooltip();

    return;
  }
  const { minTime, maxTime } = chartComp;
  const timestamps = chartComp?.dataSeries?.timestamp;
  const targetTimestamp = this.findBucket(log, timestamps);
  // const targetTimestamp = logs[0]['window_dt'];

  if (targetTimestamp && targetTimestamp >= minTime && targetTimestamp <= maxTime) {
    chartComp.showTooltip({ x: targetTimestamp });
  }
}
