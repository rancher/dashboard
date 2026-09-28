import { flowOutput } from '@shell/utils/validators/flow-output';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/flow-output', () => {
  describe('flowOutput', () => {
    describe('when verifyLocal is not in validatorArgs', () => {
      it('adds global error when globalOutputRefs is empty', () => {
        const errors: string[] = [];

        flowOutput({ globalOutputRefs: [] }, mockGetters, errors, []);

        expect(errors).toStrictEqual(['validation.flowOutput.global']);
      });

      it('adds global error when globalOutputRefs is missing', () => {
        const errors: string[] = [];

        flowOutput({}, mockGetters, errors, []);

        expect(errors).toStrictEqual(['validation.flowOutput.global']);
      });

      it('adds no error when globalOutputRefs is non-empty', () => {
        const errors: string[] = [];

        flowOutput({ globalOutputRefs: ['output-1'] }, mockGetters, errors, []);

        expect(errors).toStrictEqual([]);
      });

      it('does not check localOutputRefs', () => {
        const errors: string[] = [];

        flowOutput({ localOutputRefs: ['local-1'], globalOutputRefs: [] }, mockGetters, errors, []);

        expect(errors).toStrictEqual(['validation.flowOutput.global']);
      });
    });

    describe('when verifyLocal is in validatorArgs', () => {
      it('adds both error when both localOutputRefs and globalOutputRefs are empty', () => {
        const errors: string[] = [];

        flowOutput({ localOutputRefs: [], globalOutputRefs: [] }, mockGetters, errors, ['verifyLocal']);

        expect(errors).toStrictEqual(['validation.flowOutput.both']);
      });

      it('adds both error when both refs are missing', () => {
        const errors: string[] = [];

        flowOutput({}, mockGetters, errors, ['verifyLocal']);

        expect(errors).toStrictEqual(['validation.flowOutput.both']);
      });

      it('adds no error when localOutputRefs is non-empty', () => {
        const errors: string[] = [];

        flowOutput({ localOutputRefs: ['local-1'], globalOutputRefs: [] }, mockGetters, errors, ['verifyLocal']);

        expect(errors).toStrictEqual([]);
      });

      it('adds no error when globalOutputRefs is non-empty', () => {
        const errors: string[] = [];

        flowOutput({ localOutputRefs: [], globalOutputRefs: ['global-1'] }, mockGetters, errors, ['verifyLocal']);

        expect(errors).toStrictEqual([]);
      });

      it('adds no error when both refs are non-empty', () => {
        const errors: string[] = [];

        flowOutput(
          { localOutputRefs: ['local-1'], globalOutputRefs: ['global-1'] },
          mockGetters,
          errors,
          ['verifyLocal']
        );

        expect(errors).toStrictEqual([]);
      });
    });
  });
});
