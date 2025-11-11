/**
 * Helper class to handle steve vai revisions
 */
export class SteveRevision {
  public asNumber: number;
  public isNumber: boolean;

  constructor(public revision: any) {
    this.asNumber = Number(revision);
    this.isNumber = !Number.isNaN(this.asNumber);
  }

  isNewerThan(revision: SteveRevision): boolean {
    return SteveRevision.allNumbers([this, revision]) && this.asNumber > revision.asNumber;
  }

  private static allNumbers(revisions: SteveRevision[]): boolean {
    return revisions.every((r) => r.isNumber);
  }

  max(revision: number) {
    return Math.max(revision, this.asNumber);
  }
}
