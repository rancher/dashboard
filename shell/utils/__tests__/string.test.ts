import { decodeHtml, resourceNames } from '@shell/utils/string';

describe('fx: decodeHtml', () => {
  it('should decode HTML values from escaped string into valid markup', () => {
    const text = '&lt;i&gt;whatever&lt;/i&gt;';
    const expectation = `<i>whatever</i>`;

    const result = decodeHtml(text);

    expect(result).toStrictEqual(expectation);
  });
});

describe('fx: resourceNames', () => {
  // default plusMore function
  const t = (key: string, options: { count: number }) => {
    switch (key) {
    case 'generic.and':
      return ' and ';
    case 'generic.comma':
      return ', ';
    case 'promptRemove.andOthers': {
      if (options.count === 0) {
        return '.';
      }
      if (options.count === 1) {
        return 'and <b>one other</b>.';
      }

      return `and <b>${ options.count } others</b>.`;
    }
    }
  };

  describe.each([
    ['no options',
      [
        [[], '', {}],
        [['item1'], '<b>item1</b>.', {}],
        [['item1', 'item2'], '<b>item1</b> and <b>item2</b>.', {}],
        [['item1', 'item2', 'item3'], '<b>item1</b>, <b>item2</b> and <b>item3</b>.', {}],
        [['item1', 'item2', 'item3', 'item4', 'item5'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b> and <b>item5</b>.', {}],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>and <b>one other</b>.', {}],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>and <b>2 others</b>.', {}],
      ]
    ],
    ['plusMore option',
      [
        [[], '', { plusMore: 'foo' }],
        [['item1'], '<b>item1</b>.', { plusMore: 'foo' }],
        [['item1', 'item2'], '<b>item1</b> and <b>item2</b>.', { plusMore: 'foo' }],
        [['item1', 'item2', 'item3'], '<b>item1</b>, <b>item2</b> and <b>item3</b>.', { plusMore: 'foo' }],
        [['item1', 'item2', 'item3', 'item4', 'item5'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b> and <b>item5</b>.', { plusMore: 'foo' }],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>foo', { plusMore: 'foo' }],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>foo', { plusMore: 'foo' }],
      ]
    ],
    ['endString option',
      [
        [[], '', { endString: false }],
        [['item1'], '<b>item1</b> ', { endString: false }],
        [['item1', 'item2'], '<b>item1</b> and <b>item2</b> ', { endString: false }],
        [['item1', 'item2'], '<b>item1</b> and <b>item2</b>.', { endString: '' }],
        [['item1', 'item2'], '<b>item1</b> and <b>item2</b>foo', { endString: 'foo' }],
      ]
    ],
    [
      'plusMore & endString options', [
        [[], '', { plusMore: '', endString: false }],
        [[], '', { plusMore: 'foo', endString: 'foo' }],
        [['item1'], '<b>item1</b>foo', { plusMore: 'foo', endString: 'foo' }],
        [['item1', 'item2'], '<b>item1</b> and <b>item2</b>foo', { plusMore: 'foo', endString: 'foo' }],
        [['item1', 'item2'], '<b>item1</b> and <b>item2</b> ', { plusMore: 'foo', endString: false }],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>foo', { plusMore: 'foo', endString: 'foo' }],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>foo', { plusMore: 'foo', endString: 'foo' }],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>foo', { plusMore: 'foo', endString: false }],
        [['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'], '<b>item1</b>, <b>item2</b>, <b>item3</b>, <b>item4</b>, <b>item5</b>foo', { plusMore: 'foo', endString: false }],
      ]
    ]
  ])('should build a single message from a list of names, with: %p', (_, args) => {
    it.each(args)(`having: %p`, (
      names,
      expectation,
      options,
    ) => {
      const result = resourceNames(names, t, options);

      expect(result).toStrictEqual(expectation);
    });
  });
});
