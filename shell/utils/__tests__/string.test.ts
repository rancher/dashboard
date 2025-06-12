import { decodeHtml, resourceNames, pathArrayToTree } from '@shell/utils/string';

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
      options: any,
    ) => {
      const result = resourceNames(names, options.plusMore, t, options.endString);

      expect(result).toStrictEqual(expectation);
    });
  });
});

describe('fx: pathArrayToTree', () => {
  interface TreeNode {
    name: string;
    children: TreeNode[];
  }

  function sortTree(nodes: TreeNode[]): void {
    if (!nodes) return;
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      }
    });
  }

  it('should return an empty array for an empty input array', () => {
    const paths: string[] = [];

    expect(pathArrayToTree(paths)).toStrictEqual([]);
  });

  it('should convert simple single-level paths correctly', () => {
    const paths: string[] = [
      'file1.txt',
      'folderA',
      'itemB'
    ];
    const expected: TreeNode[] = [
      { name: 'file1.txt', children: [] },
      { name: 'folderA', children: [] },
      { name: 'itemB', children: [] },
    ];
    const actual = pathArrayToTree(paths);

    sortTree(actual); // Sort the actual output for deterministic comparison
    expect(actual).toStrictEqual(expected);
  });

  it('should convert two-level nested paths correctly', () => {
    const paths: string[] = [
      'folderA/file1.txt',
      'folderC/file3.txt'
    ];
    const expected: TreeNode[] = [
      {
        name:     'folderA',
        children: [
          { name: 'file1.txt', children: [] },
        ]
      },
      {
        name:     'folderC',
        children: [
          { name: 'file3.txt', children: [] }
        ]
      },
    ];
    const actual = pathArrayToTree(paths);

    sortTree(actual);
    expect(actual).toStrictEqual(expected);
  });

  it('should handle deep nesting and common prefixes correctly', () => {
    const paths: string[] = [
      'root/level1/level2/file.doc',
      'root/level1/another_file.txt',
      'root/diff_level1/config.json'
    ];
    const expected: TreeNode[] = [
      {
        name:     'root',
        children: [
          {
            name:     'diff_level1',
            children: [
              { name: 'config.json', children: [] }
            ]
          },
          {
            name:     'level1',
            children: [
              { name: 'another_file.txt', children: [] },
              {
                name:     'level2',
                children: [
                  { name: 'file.doc', children: [] }
                ]
              }
            ]
          }
        ]
      }
    ];
    const actual = pathArrayToTree(paths);

    sortTree(actual);
    expect(actual).toStrictEqual(expected);
  });

  it('should handle leading/trailing/multiple slashes by treating them as path segments', () => {
    const paths: string[] = [
      '/path/to/file.txt', // Starts with a slash
      'path/to/another.txt/', // Ends with a slash (adds an empty segment)
      '//root/item//subitem//', // Multiple slashes (adds empty segments)
      'root/item/another_subitem'
    ];
    const expected: TreeNode[] = [
      {
        name:     '',
        children: [
          {
            name:     '',
            children: [
              {
                name:     'root',
                children: [
                  {
                    name:     'item',
                    children: [
                      {
                        name:     '',
                        children: [
                          {
                            name:     'subitem',
                            children: [
                              {
                                name:     '',
                                children: [
                                  {
                                    name:     '',
                                    children: [
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name:     'path',
            children: [
              {
                name:     'to',
                children: [
                  {
                    name:     'file.txt',
                    children: [
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name:     'path',
        children: [
          {
            name:     'to',
            children: [
              {
                name:     'another.txt',
                children: [
                  {
                    name:     '',
                    children: [
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name:     'root',
        children: [
          {
            name:     'item',
            children: [
              {
                name:     'another_subitem',
                children: [
                ],
              },
            ],
          },
        ],
      },
    ];
    const actual = pathArrayToTree(paths);

    sortTree(actual);
    expect(actual).toStrictEqual(expected);
  });

  it('should produce the same structure regardless of input order', () => {
    const paths1: string[] = ['a/b', 'a/c'];
    const paths2: string[] = ['a/c', 'a/b'];

    const actual1 = pathArrayToTree(paths1);

    sortTree(actual1);
    const actual2 = pathArrayToTree(paths2);

    sortTree(actual2);

    expect(actual1).toStrictEqual(actual2);
  });

  it('should handle names with special characters (not slashes) correctly', () => {
    const paths: string[] = [
      'my-folder/file_name.1.txt',
      'another folder/item with spaces'
    ];
    const expected: TreeNode[] = [
      {
        name:     'another folder',
        children: [
          { name: 'item with spaces', children: [] }
        ]
      },
      {
        name:     'my-folder',
        children: [
          { name: 'file_name.1.txt', children: [] }
        ]
      }
    ];
    const actual = pathArrayToTree(paths);

    sortTree(actual);
    expect(actual).toStrictEqual(expected);
  });

  it('should handle duplicate paths correctly, only adding unique structure', () => {
    const paths: string[] = [
      'folder/file.txt',
      'folder/file.txt', // Duplicate
      'other_folder/another_file.txt'
    ];
    const expected: TreeNode[] = [
      {
        name:     'folder',
        children: [
          { name: 'file.txt', children: [] }
        ]
      },
      {
        name:     'other_folder',
        children: [
          { name: 'another_file.txt', children: [] }
        ]
      }
    ];
    const actual = pathArrayToTree(paths);

    sortTree(actual);
    expect(actual).toStrictEqual(expected);
  });
});
