/**
 *
 */
export class SteveRevision {
  public asNumber: number;
  public isNumber: boolean;

  constructor(public revision: any) {
    this.asNumber = Number(revision);
    this.isNumber = !Number.isNaN(this.asNumber);
  }

  isLarger(revision: number): boolean {
    return revision > this.asNumber;
  }

  max(revision: number) {
    return Math.max(revision, this.asNumber);
  }
}
