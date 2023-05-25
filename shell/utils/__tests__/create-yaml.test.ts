import {
  getBlockDescriptor,
  dumpBlock,
} from '@shell/utils/create-yaml';

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
});
