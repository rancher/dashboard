import {
  getBlockDescriptor,
  dumpBlock,
} from '@shell/utils/create-yaml';
import jsyaml from 'js-yaml';

const key = 'example';
const randomData = '\n      foo\n      bar\n';

const scalarStyles = ['>', '|'];
const chomping = ['+', '-', ''];
const indentations = ['4', '2', ''];

describe('fx: getBlockDescriptor', () => {
  describe('should parse blocks header for all block indicators combo', () => {
    scalarStyles.forEach((scalar) => {
      chomping.forEach((chomping) => {
        indentations.forEach((indentation) => {
          const combo = `${ scalar }${ indentation }${ chomping }`;

          it(`combo: ${ combo }`, () => {
            const toParse = `${ key }: ${ combo }${ randomData }`;

            const desc = getBlockDescriptor(toParse, key);

            expect(desc?.header).toBe(`${ key }: ${ combo }`);
            expect(desc?.indentation).toBe(indentation);
          });
        });
      });
    });
  });
});

describe('fx: dumpBlock', () => {
  describe('should create a data block replacing indicators with blocks indicator from options', () => {
    const key = 'example';

    scalarStyles.forEach((scalarStyle) => {
      chomping.forEach((chomping) => {
        const options = {
          [key]: {
            chomping,
            scalarStyle
          }
        };

        it(`options: { scalarStyle: ${ scalarStyle }, chomping: ${ chomping } } with indentation`, () => {
          const data = { [key]: ' foo  \n bar   \n   \n   foo\n   bar\n   ' };
          const block = dumpBlock(data, options);

          expect(block.includes(`example: ${ scalarStyle }${ chomping }2`)).toBeTruthy();
        });

        it(`options: { scalarStyle: ${ scalarStyle }, chomping: ${ chomping } } without indentation`, () => {
          const data = { [key]: 'foo  \nbar   \n\nfoo\nbar\n   ' };
          const block = dumpBlock(data, options);

          expect(block.includes(`example: ${ scalarStyle }${ chomping }`)).toBeTruthy();
        });
      });
    });
  });

  it('should not create a data block when the value of a key is not a string', () => {
    const data = { key: { test: 'test' } };

    const expectedResult = jsyaml.dump(data);
    const result = dumpBlock(data);

    expect(result).toStrictEqual(expectedResult);
  });

  it('should retain line breaks when a line longer than 80 characters exists', () => {
    const data = {
      'managerApiConfiguration.properties': `# Sample XPlanManagerAPI Configuration (if this comment is longer than 80 characters, the output should remain the same)

apiUrl=https://example.com/xplan-api-manager
contactEmailAddress=contact@example.com
termsOfServiceUrl=https://example.com/terms
documentationUrl=https://example.com/docs
wmsUrl=https://example.com/xplan-wms/services
skipSemantic=false
skipGeometric=true`
    };

    const expectedResult = `managerApiConfiguration.properties: >+
  # Sample XPlanManagerAPI Configuration (if this comment is longer than 80 characters, the output should remain the same)

  apiUrl=https://example.com/xplan-api-manager
  contactEmailAddress=contact@example.com
  termsOfServiceUrl=https://example.com/terms
  documentationUrl=https://example.com/docs
  wmsUrl=https://example.com/xplan-wms/services
  skipSemantic=false
  skipGeometric=true
`;

    const yamlModifiers = {
      lineWidth:                            -1,
      'managerApiConfiguration.properties': {
        chomping:    '+',
        scalarStyle: '>',
      }
    };

    const result = dumpBlock(data, yamlModifiers);

    expect(result).toStrictEqual(expectedResult);
  });

  it('should not attempt to replace indicators when a header cannot be found', () => {
    const data = {
      a: 'a\nb\tc',
      b: 'a\nb\tc',
      c: `a
b c`
    };

    const expectedResult = `a: "a\\nb\\tc"\nb: "a\\nb\\tc"\nc: |+\n  a\n  b c\n`;

    const yamlModifiers = {
      lineWidth: -1,
      a:         { chomping: '+' },
      b:         { chomping: '+' },
      c:         { chomping: '+' },
    };

    const result = dumpBlock(data, yamlModifiers);

    expect(result).toStrictEqual(expectedResult);
  });
});
