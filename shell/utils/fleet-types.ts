
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
