export type WorkloadType = 'workload' | 'pods' | 'apps.deployments' | 'replicasets' | 'daemonsets' | 'statefulsets' | 'jobs' | 'cronjobs'

export interface FleetResourceState {
  count: number,
  label: string,
  color?: string,
  status?: string
}

export interface FleetDashboardState {
  index: number,
  id: string,
  label: string,
  color: string,
  icon: string,
  stateBackground: string
}

export interface FleetDashboardResourceStates {
  stateDisplay: string,
  stateSort: string,
  statePanel: FleetDashboardState,
  resources: object[]
}

// TODO complete type definition
export interface Application {
  id: string,
  metadata: {
    namespace: string,
    name: string,
  }
  _detailLocation: {
    name: string
  }
}

export type TargetMode = 'none' | 'all' | 'clusters' | 'local' | 'advanced';

export type MatchLabels = Record<string, string>;

export interface Expression {
  key: string,
  operator: string,
  values: string[]
}

export interface Selector {
  key?: number,
  matchLabels?: MatchLabels,
  matchExpressions?: Expression[]
}

export interface Target {
  name?: string,
  clusterName?: string,
  clusterSelector?: Selector,
  clusterGroup?: string,
  clusterGroupSelector?: Selector
}
