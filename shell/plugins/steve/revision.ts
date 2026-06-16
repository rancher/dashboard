/**
 * Helper class to handle Steve API revisions comparisons
 */
export class SteveRevision {
  public asNumber: number;
  public isNumber: boolean;

  constructor(public revision: any) {
    this.asNumber = Number(revision);
    this.isNumber = !Number.isNaN(this.asNumber);
  }

  /**
   * Is this provided revision newer than this revision?
   *
   * @param revision
   * @returns
   */
  isNewerThan(revision: SteveRevision): boolean {
    return SteveRevision.areAllNumbers([this, revision]) && this.asNumber > revision.asNumber;
  }

  private static areAllNumbers(revisions: SteveRevision[]): boolean {
    return revisions.every((r) => r.isNumber);
  }
}
