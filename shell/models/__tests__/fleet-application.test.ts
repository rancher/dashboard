import FleetApplication from '@shell/models/fleet-application';

describe('class FleetApplication', () => {
  describe('applicationType', () => {
    it('should return the kind property', () => {
      const instance = new FleetApplication({ kind: 'GitRepo' });

      expect(instance.applicationType).toStrictEqual('GitRepo');
    });
  });
});
