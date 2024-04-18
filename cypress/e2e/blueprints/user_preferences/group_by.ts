export function groupByPayload(userId: string, clusterName: string, groupBy:string, namespace: string):object {
  return {
    id:   userId,
    type: 'userpreference',
    data: {
      cluster:         clusterName,
      'group-by':      groupBy,
      'ns-by-cluster': namespace,
    }
  };
}
