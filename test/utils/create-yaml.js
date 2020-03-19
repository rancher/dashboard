import test from 'ava';
import YAML from 'yaml';
import sinon from 'sinon';
import * as CreateYaml from '@/utils/create-yaml';

const sandbox = sinon.createSandbox();

test.afterEach.always(() => {
  sandbox.restore();
});

test.serial('getAllPathTypePairs', (t) => {
  const expandedSchema = {
    type:                   'floof',
    expandedResourceFields: {
      map: {
        type:                   'map',
        expandedSubType:  { type: 'string', isPrimitive: true }
      },
      array: {
        type:            'array',
        expandedSubType: {
          type:                   'weird',
          expandedResourceFields: { sub: { type: 'string', isPrimitive: true } }
        }
      },
      number: { type: 'int', isPrimitive: true }
    },
  };

  const result = CreateYaml.getAllPathTypePairs(expandedSchema);

  t.deepEqual(result, [
    {
      path: ['map', 'key'],
      type: { type: 'string', isPrimitive: true }
    },
    {
      path: ['array', 0, 'sub'],
      type: { type: 'string', isPrimitive: true }
    },
    {
      path: ['number'],
      type: { type: 'int', isPrimitive: true }
    }
  ]);
});

test.serial('createPath', (t) => {
  const data = { existingField: 'hello' };
  const objectPath = ['object', 'path'];
  const arrayPath = ['array', 'path', 0, 'hello'];
  const existingPath = ['existingField'];
  const typeAnnotation = { type: 'string' };

  let document = YAML.parseDocument(YAML.stringify(data));

  // Object path without annotation
  CreateYaml.createPath(document, objectPath);
  t.is(document.toString(), 'existingField: hello\nobject:\n  path: {}\n');

  // Object path with annotation
  document = YAML.parseDocument(YAML.stringify(data));
  CreateYaml.createPath(document, objectPath, typeAnnotation);
  t.is(document.toString(), 'existingField: hello\nobject:\n  #typeAnnotation\n  path: "#typeAnnotation - string"\n');

  // Array path without annotation
  document = YAML.parseDocument(YAML.stringify(data));
  CreateYaml.createPath(document, arrayPath);
  t.is(document.toString(), 'existingField: hello\narray:\n  path:\n    - hello: {}\n');

  // Object path with annotation
  document = YAML.parseDocument(YAML.stringify(data));
  CreateYaml.createPath(document, arrayPath, typeAnnotation);
  t.is(document.toString(), 'existingField: hello\narray:\n  #typeAnnotation\n  path:\n    #typeAnnotation\n    - hello: "#typeAnnotation - string"\n');

  // Existing path without annotation
  document = YAML.parseDocument(YAML.stringify(data));
  CreateYaml.createPath(document, existingPath);
  t.is(document.toString(), 'existingField: hello\n');

  // Existing path with annotation
  document = YAML.parseDocument(YAML.stringify(data));
  CreateYaml.createPath(document, existingPath, typeAnnotation);
  t.is(document.toString(), 'existingField: hello\n');

  t.true(true);
});

test.serial('isNodeEmpty', (t) => {
  const emptyList = YAML.createNode([]);
  const nonEmptyList = YAML.createNode([1]);

  const emptyObject = YAML.createNode({});
  const nonEmptyObject = YAML.createNode({ a: 'b' });

  const zeroNode = YAML.createNode(0);
  const falseNode = YAML.createNode(false);

  t.true(CreateYaml.isNodeEmpty(emptyList));
  t.false(CreateYaml.isNodeEmpty(nonEmptyList));

  t.true(CreateYaml.isNodeEmpty(emptyObject));
  t.false(CreateYaml.isNodeEmpty(nonEmptyObject));

  t.true(CreateYaml.isNodeEmpty(zeroNode), 'A falsey scalar should not be considered empty');
  t.true(CreateYaml.isNodeEmpty(falseNode), 'A false scalar should not be considered empty');
});

test.serial('addMissingFields', (t) => {
  const document = { document: true };
  const expandedSchema = { expandedSchema: true };
  const pairs = [
    { path: 'metadata.name', type: 'string' },
    { path: 'metadata.number', type: 'number' }
  ];
  const getAllPathTypePairsStub = sandbox.stub(CreateYaml, 'getAllPathTypePairs');
  const createPathStub = sandbox.stub(CreateYaml, 'createPath');

  getAllPathTypePairsStub.returns(pairs);

  CreateYaml.addMissingFieldsToDocument(document, undefined);
  t.true(getAllPathTypePairsStub.notCalled);

  CreateYaml.addMissingFieldsToDocument(document, expandedSchema);
  t.true(getAllPathTypePairsStub.calledWith(expandedSchema));
  pairs.forEach((pair, i) => {
    t.true(createPathStub.getCall(i).calledWith(document, pair.path, pair.type));
  });
});

test.serial('removeExtraneousFieldsFromDocument', (t) => {
  const data = {
    extraField: 'hello',
    id:         'hello',
    type:       'hello',
    _type:      'hello',
    links:      'hello',
    status:     'hello',
    metadata:   {
      creationTimestamp:          'hello',
      clusterName:                'hello',
      deletionGracePeriodSeconds: 'hello',
      managedFields:              'hello',
      generateName:               'hello',
      generation:                 'hello',
      deletionTimestamp:          'hello',
      finalizers:                 'hello',
      initializers:               'hello',
      ownerReferences:            'hello',
      resourceVersion:            'hello',
      selfLink:                   'hello',
      uid:                        'hello',
      state:                      'hello',
      fields:                     'hello',
    }
  };
  const expectedResultAsString = 'extraField: hello\nmetadata: {}\n';
  const document = YAML.parseDocument(YAML.stringify(data));

  CreateYaml.removeExtraneousFieldsFromDocument(document);
  const resultAsString = document.toString();

  t.is(resultAsString, expectedResultAsString);
});

test.serial('commentLine', (t) => {
  const noSpace = 'key';
  const noSpaceExpectedResult = '#key';
  const space = '  key';
  const spaceExpectedResult = '# key';

  const noSpaceResult = CreateYaml.commentLine(noSpace);
  const spaceResult = CreateYaml.commentLine(space);

  t.is(noSpaceResult, noSpaceExpectedResult);
  t.is(spaceResult, spaceExpectedResult);
});

test.serial('resolveCollectionTypeAnnotations', (t) => {
  const input = ['object:', '  #typeAnnotation', '  floof: "#typeAnnotation - string"', '  two: three'];
  const expectedResult = ['#object:', '  floof: "#typeAnnotation - string"', '  two: three'];

  const result = CreateYaml.resolveCollectionTypeAnnotations(input);

  t.deepEqual(result, expectedResult);
});

test.serial('resolveScalarTypeAnnotations', (t) => {
  const input = ['object:', '  #typeAnnotation', '  floof: "#typeAnnotation - string"', '  two: three'];
  const expectedResult = ['object:', '  #typeAnnotation', '# floof: string', '  two: three'];

  const result = CreateYaml.resolveScalarTypeAnnotations(input);

  t.deepEqual(result, expectedResult);
});

test.serial('resolveTypeAnnotationsAndConvertToString', (t) => {
  const documentString = 'hello: world\nline: two\n';
  const document = YAML.parseDocument(documentString);
  const linesForCollection = documentString.split('\n');
  const linesForScalar = [...linesForCollection, 'scalar'];
  const linesForResult = [...linesForScalar, 'linesResult'];
  const expectedResult = linesForResult.join('\n');

  const resolveCollectionTypeAnnotationsStub = sandbox.stub(CreateYaml, 'resolveCollectionTypeAnnotations');
  const resolveScalarTypeAnnotationsStub = sandbox.stub(CreateYaml, 'resolveScalarTypeAnnotations');

  resolveCollectionTypeAnnotationsStub.returns(linesForScalar);
  resolveScalarTypeAnnotationsStub.returns(linesForResult);
  const result = CreateYaml.resolveTypeAnnotationsAndConvertToString(document);

  t.true(resolveCollectionTypeAnnotationsStub.calledWith(sinon.match.array.deepEquals(linesForCollection)));
  t.true(resolveScalarTypeAnnotationsStub.calledWith(linesForScalar));
  t.is(result, expectedResult);
});

test.serial('createYaml', (t) => {
  const data = { data: true };
  const expandedSchema = { expandedSchema: true };
  const stringifiedData = 'stringifiedData';
  const document = { document: true };
  const resolveString = 'resolveString';

  const stringifyStub = sandbox.stub(YAML, 'stringify');
  const parseDocumentStub = sandbox.stub(YAML, 'parseDocument');
  const addMissingFieldsToDocumentStub = sandbox.stub(CreateYaml, 'addMissingFieldsToDocument');
  const removeExtraneousFieldsFromDocumentStub = sandbox.stub(CreateYaml, 'removeExtraneousFieldsFromDocument');
  const resolveTypeAnnotationsAndConvertToStringStub = sandbox.stub(CreateYaml, 'resolveTypeAnnotationsAndConvertToString');

  stringifyStub.returns(stringifiedData);
  parseDocumentStub.returns(document);
  resolveTypeAnnotationsAndConvertToStringStub.returns(resolveString);

  const result = CreateYaml.createYaml(data, expandedSchema);

  t.true(stringifyStub.calledWith(data));
  t.true(parseDocumentStub.calledWith(stringifiedData));
  t.true(addMissingFieldsToDocumentStub.calledWith(document, expandedSchema));
  t.true(removeExtraneousFieldsFromDocumentStub.calledWith(document));
  t.true(resolveTypeAnnotationsAndConvertToStringStub.calledWith(document));
  t.is(result, resolveString);
});
