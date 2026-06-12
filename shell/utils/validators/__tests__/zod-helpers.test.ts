import { createZodHelpers } from '@shell/utils/validators/zod-helpers';

const mockT = (key: string, args?: Record<string, unknown>): string => {
  if (args) {
    return `${ key }[${ Object.values(args).join(',') }]`;
  }

  return key;
};

const { field } = createZodHelpers(mockT);

const REQUIRED_MSG = (fieldKey: string) => `validation.required[${ fieldKey }]`;
const URL_MSG = (fieldKey: string) => `validation.url[${ fieldKey }]`;
const GENERIC_URL_MSG = 'validation.genericUrl';

describe('createZodHelpers', () => {
  describe('builder style — field(key).chain()', () => {
    describe('field(key) — optional string', () => {
      it.each([
        ['empty string', ''],
        ['any string', 'hello'],
        [null, null],
        [undefined, undefined],
      ])('passes for %s', (_label, value) => {
        expect(field('myKey').safeParse(value).success).toBe(true);
      });
    });

    describe('field(key).required() — required string', () => {
      const schema = field('myKey').required();

      it('passes when value is provided', () => {
        expect(schema.safeParse('hello').success).toBe(true);
      });

      it.each([
        ['empty string', ''],
        [null, null],
        [undefined, undefined],
        ['whitespace-only string', '   '],
      ])('fails for %s', (_label, value) => {
        const result = schema.safeParse(value);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(REQUIRED_MSG('myKey'));
      });
    });

    describe('field().required() — required with no static key', () => {
      const schema = field().required();

      it('passes when value is provided', () => {
        expect(schema.safeParse('hello').success).toBe(true);
      });

      it.each([
        ['empty string', ''],
        [null, null],
        [undefined, undefined],
      ])('fails for %s', (_label, value) => {
        const result = schema.safeParse(value);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(REQUIRED_MSG(''));
      });
    });

    describe('field(key).url() — optional URL', () => {
      const schema = field('myKey').url();

      it.each([
        ['empty string', ''],
        [null, null],
        [undefined, undefined],
      ])('passes for %s (field is optional)', (_label, value) => {
        expect(schema.safeParse(value).success).toBe(true);
      });

      it('passes for a valid URL', () => {
        expect(schema.safeParse('https://example.com').success).toBe(true);
      });

      it('fails for an invalid URL', () => {
        const result = schema.safeParse('not-a-url');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(URL_MSG('myKey'));
      });
    });

    describe('field().url() — no key falls back to the generic URL message', () => {
      const schema = field().url();

      it('fails for an invalid URL', () => {
        const result = schema.safeParse('not-a-url');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(GENERIC_URL_MSG);
      });
    });

    describe('field(key).url(keyOverride) — key override', () => {
      const schema = field('myKey').url('overrideKey');

      it('uses the override key in the URL error message', () => {
        const result = schema.safeParse('not-a-url');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(URL_MSG('overrideKey'));
      });
    });

    describe('field(key).required().url() — required URL', () => {
      const schema = field('myKey').required().url();

      it('passes for a valid URL', () => {
        expect(schema.safeParse('https://example.com').success).toBe(true);
      });

      it('fails with required message when empty', () => {
        const result = schema.safeParse('');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(REQUIRED_MSG('myKey'));
      });

      it('fails with URL message for a non-empty invalid URL', () => {
        const result = schema.safeParse('not-a-url');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(URL_MSG('myKey'));
      });
    });

    describe('field(key).url().required() — chain order does not affect behaviour', () => {
      const schema = field('myKey').url().required();

      it('fails with required message when empty', () => {
        const result = schema.safeParse('');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(REQUIRED_MSG('myKey'));
      });

      it('fails with URL message for a non-empty invalid URL', () => {
        const result = schema.safeParse('not-a-url');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(URL_MSG('myKey'));
      });
    });

    describe('field(key).required(keyOverride) — key override', () => {
      it('uses the override key in the required error message', () => {
        const schema = field('myKey').required('overrideKey');
        const result = schema.safeParse('');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(REQUIRED_MSG('overrideKey'));
      });

      it('falls back to the field key when no override is given', () => {
        const schema = field('myKey').required();
        const result = schema.safeParse('');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(REQUIRED_MSG('myKey'));
      });
    });

    describe('immutability — chaining off a base does not mutate it', () => {
      it('base remains optional after branching', () => {
        const base = field('myKey').url();
        const withReq = base.required();

        expect(base.safeParse('').success).toBe(true);
        expect(withReq.safeParse('').success).toBe(false);
      });
    });
  });
});
