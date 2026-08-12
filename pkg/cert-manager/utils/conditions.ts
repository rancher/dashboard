export interface Condition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  observedGeneration?: number;
}

export function conditionOf(resource: any, type: string): Condition | undefined {
  return (resource?.status?.conditions || []).find((c: Condition) => c.type === type);
}

export function isConditionTrue(resource: any, type: string): boolean {
  return conditionOf(resource, type)?.status === 'True';
}

export function isConditionFalse(resource: any, type: string): boolean {
  return conditionOf(resource, type)?.status === 'False';
}
