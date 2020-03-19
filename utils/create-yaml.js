import YAML from 'yaml';
import { isEmpty } from 'lodash';
import { createAllSubArrays } from '@/utils/array';
import { COLLECTION_TYPES } from '@/config/types';

const NEVER_ADD = [
  'id',
  'type',
  '_type',
  'links',
  'status',
  'metadata.creationTimestamp',
  'metadata.clusterName',
  'metadata.deletionGracePeriodSeconds',
  'metadata.managedFields',
  'metadata.generateName',
  'metadata.generation',
  'metadata.deletionTimestamp',
  'metadata.finalizers',
  'metadata.initializers',
  'metadata.ownerReferences',
  'metadata.resourceVersion',
  'metadata.selfLink',
  'metadata.uid',
  'metadata.state',
  'metadata.fields',
];

const TYPE_ANNOTATION = 'typeAnnotation';

/**
 * Given an expanded schema generate a list of path type pairs which look like
 * [
 *  {
 *    path: ['metadata', 'name'],
 *    type: { type: 'string', isPrimitive: true }
 *  }
 * ]
 * @param {*} expandedSchema A schema with the extra fields expandedResourceFields and expandedSubTypes
 *                           which links to schemas wrather than typeNames.
 */
export function getAllPathTypePairs(expandedSchema) {
  if (expandedSchema.isPrimitive) {
    return [{
      path: [],
      type: expandedSchema
    }];
  }

  let entries = Object.entries(expandedSchema.expandedResourceFields || {});

  if (expandedSchema.type === COLLECTION_TYPES.array) {
    entries = [[0, expandedSchema.expandedSubType]];
  }

  if (expandedSchema.type === COLLECTION_TYPES.map) {
    entries = [['key', expandedSchema.expandedSubType]];
  }

  const nestedResult = entries
    .map((entry) => {
      const prefix = entry[0];
      const restOfSchema = entry[1];

      const pathTypePairs = exports.getAllPathTypePairs(restOfSchema);

      return pathTypePairs.map(pair => ({
        path: [prefix, ...pair.path],
        type: pair.type
      }));
    });

  return [].concat(...nestedResult);
}

/**
 * Create the object chain represented by path inside of the document.
 *
 * If typeAnnotation is present then we will annotate any newly created
 * portions of a path with a #typeAnnotation comment at the top of the objet
 * and sentinel value of "#typeInfo - string" at the end of a the path.
 * @param {Document} document The document to add paths to
 * @param {Array} path An array that represents the path that should be created.
 * @param {Object} typeAnnotation A schema object that has a type we should use to
 *                           annotate a field with a sentinel value. This will
 *                           also annotate any newly created portions of the path with
 *                           a #typeAnnotation comment.
 */
export function createPath(document, path, typeAnnotation) {
  const subPaths = createAllSubArrays(path);

  subPaths.forEach((subPath) => {
    const existingValue = document.getIn(subPath);

    if (!existingValue || (existingValue?.items && existingValue.items.length === 0)) {
      const prefixPath = subPath.slice(0, -1);
      const suffix = subPath.slice(-1);

      // If there's a number we need to make sure an array is created first.
      const newNode = YAML.createNode({});

      if (typeAnnotation) {
        newNode.commentBefore = TYPE_ANNOTATION;
      }

      if (typeof suffix[0] === 'number') {
        document.setIn(prefixPath, YAML.createNode([]));
        document.addIn(prefixPath, newNode);
      } else {
        document.setIn(subPath, newNode);
      }
    }
  });

  if (typeAnnotation && isNodeEmpty(document.getIn(path))) {
    document.setIn(path, `#${ TYPE_ANNOTATION } - ${ typeAnnotation.type }`);
  }
}

/**
 * Checks to see if a YAML.node is an empty collection
 * @param {YAML.Node} node YAML.Node
 */
export function isNodeEmpty(node) {
  return typeof node === 'undefined' || (typeof node === 'object' && isEmpty(node?.items));
}

/**
 * All fields that are in the schema that are missing from the document are added to the document.
 * @param {YAML.Document} document YAML.Document
 * @param {*} expandedSchema A schema with the extra fields expandedResourceFields and expandedSubTypes
 *                           which links to schemas wrather than typeNames.
 */
export function addMissingFieldsToDocument(document, expandedSchema) {
  if (!expandedSchema) {
    return;
  }

  const pathTypePairs = exports.getAllPathTypePairs(expandedSchema);

  pathTypePairs.forEach(pair => exports.createPath(document, pair.path, pair.type));
}

/**
 * Removes all fields from the document which are listed in the NEVER_ADD.
 * @param {YAML.Document} document YAML.Document
 */
export function removeExtraneousFieldsFromDocument(document) {
  NEVER_ADD
    .map(stringPath => stringPath.split('.'))
    .forEach((path) => {
      if (document.hasIn(path)) {
        document.deleteIn(path);
      }
    });
}

/**
 * Comments out a line without affecting the indentation.
 * @param {String} line a line of YAML
 */
export function commentLine(line) {
  const correctedLine = /^\s.+/.test(line) ? line.substring(1) : line;

  return `#${ correctedLine }`;
}

/**
 * Looks for collection type annotations and comments out the collection.
 *
 * This is neccessary because the library YAML doesn't allow you to create
 * a comment node and adding comments to the neighboring nodes makes the code
 * clunky compared to doing a resolve pass.
 *
 * Source                   ->            Result
 * collection:                            #collection:
 *   #typeAnnotation                        key: value
 *   key: value
 * @param {*} documentArray
 */
export function resolveCollectionTypeAnnotations(documentArray) {
  return documentArray.reduce((agg, line) => {
    const lastLine = (agg.slice(-1)[0] || '');
    const isTypeAnnotation = line.trim() === `#${ TYPE_ANNOTATION }`;
    const beggining = isTypeAnnotation ? agg.slice(0, -1) : agg;
    const newLine = isTypeAnnotation ? commentLine(lastLine) : line;

    return [...beggining, newLine];
  }, []);
}

/**
 * Looks for scalar type annotations and comments out the scalar.
 *
 * Source                   ->            Result
 * key: '#typeAnnotation - string'        #key: string
 * @param {*} documentArray
 */
export function resolveScalarTypeAnnotations(documentArray) {
  const annotation = `#${ TYPE_ANNOTATION } - `;

  return documentArray.map((line) => {
    return line.includes(annotation)
      ? exports.commentLine(line.replace(annotation, '').replace(/\"+/g, ''))
      : line;
  });
}

/**
 * Looks for collection and scalar type annotations and appropriately comments
 * out the sections.
 *
 * This is neccessary because the library YAML doesn't allow you to create
 * a comment node and adding comments to the neighboring nodes makes the code
 * clunky compared to doing a resolve pass.
 *
 * @param {YAML.Document} document YAML.Document
 */
export function resolveTypeAnnotationsAndConvertToString(document) {
  const documentAsString = document.toString();
  let documentAsArray = documentAsString.split('\n');

  documentAsArray = exports.resolveCollectionTypeAnnotations(documentAsArray);
  documentAsArray = exports.resolveScalarTypeAnnotations(documentAsArray);

  return documentAsArray.join('\n');
}

/**
 * Given a js object and an expanded schema we will add fields
 * that are in the schema that are missing from data, remove fields that
 * are a part of the NEVER_ADD list, add type annotations as comments
 * and serialize to yaml.
 * @param {*} data Arbitrary js object
 * @param {*} expandedSchema A schema with the extra fields expandedResourceFields and expandedSubTypes
 *                           which links to schemas wrather than typeNames.
 */
export function createYaml(data, expandedSchema) {
  const document = YAML.parseDocument(YAML.stringify(data));

  exports.addMissingFieldsToDocument(document, expandedSchema);
  exports.removeExtraneousFieldsFromDocument(document);

  return exports.resolveTypeAnnotationsAndConvertToString(document);
}
