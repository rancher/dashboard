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
