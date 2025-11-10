/**
 * TODO: RC
 */
export class SteveRevision {
  public asNumber: number;
  public isNumber: boolean;

  constructor(public revision: any) {
    this.asNumber = Number(revision);
    this.isNumber = !Number.isNaN(this.asNumber);
  }

  isNewer(revision: SteveRevision): boolean {
    return this.isNumber && revision.isNumber && this.asNumber > revision.asNumber;
  }

  max(revision: number) {
    return Math.max(revision, this.asNumber);
  }
}
