/*
* Vue syntax specific utilities
*/
const isSimpleIdentifier = (str) => /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str.trim());
const isBracketedExpression = (str) => str.trim().startsWith('[') && str.trim().endsWith(']');
const isStringLiteral = (str) => /^['"].*['"]$/.test(str.trim());
// Extracts the key expression from a v-for directive.
const extractKeyExpression = (vForContent) => {
  const vForMatch = vForContent.match(/^\s*\(([^,]+),\s*([^)]+)\)\s+in\s+(.*)$/);
  let keyExpression = null;

  if (vForMatch) {
    // v-for="(item, key) in items"
    keyExpression = vForMatch[2].trim();
  } else {
    const simpleVForMatch = vForContent.match(/^\s*([^\s]+)\s+in\s+(.*)$/);

    if (simpleVForMatch) {
      // v-for="item in items"
      // Use 'item' as key if it's a simple identifier
      keyExpression = isSimpleIdentifier(simpleVForMatch[1].trim()) ? simpleVForMatch[1].trim() : null;
    }
  }

  return keyExpression;
};
// Adds the :key attribute to a tag if it doesn't already have one.
const addKeyAttribute = (tag, keyExpression) => {
  // Add space if necessary
  const space = tag.endsWith(' ') ? '' : ' ';

  return `${ tag }${ space }:key="${ keyExpression }"`;
};
const vueSetReplacement = (match, obj, prop, val) => {
  prop = prop.trim();
  obj = obj.trim();
  val = val.trim();

  if (isBracketedExpression(prop)) {
    return `${ obj }${ prop } = ${ val }`;
  } else if (isStringLiteral(prop)) {
    return `${ obj }[${ prop }] = ${ val }`;
  } else if (isSimpleIdentifier(prop)) {
    return `${ obj }.${ prop } = ${ val }`;
  } else {
    return `${ obj }[${ prop }] = ${ val }`;
  }
};
const vueDeleteReplacement = (match, obj, prop) => {
  prop = prop.trim();
  obj = obj.trim();

  if (isBracketedExpression(prop)) {
    return `delete ${ obj }${ prop }`;
  } else if (isStringLiteral(prop)) {
    return `delete ${ obj }[${ prop }]`;
  } else if (isSimpleIdentifier(prop)) {
    return `delete ${ obj }.${ prop }`;
  } else {
    return `delete ${ obj }[${ prop }]`;
  }
};
const vueKeyReplacement = (match, beforeTagEnd, vForContent, tagClose) => {
  // Check if :key exists in the tag
  if (beforeTagEnd.includes(':key=')) {
    return match; // :key already exists, do not modify
  }

  const keyExpression = extractKeyExpression(vForContent);

  if (keyExpression) {
    const updatedTag = addKeyAttribute(beforeTagEnd, keyExpression);

    return `${ updatedTag }${ tagClose }`;
  } else {
  // Cannot safely determine a key, so do not add one
    return match;
  }
};
const vueTemplateKeyReplacement = (match, templateStart, templateContent, templateEnd) => {
  // Check if :key is on the <template> tag
  const hasKeyOnTemplate = /:key=/.test(templateStart);

  // Find any :key on direct child elements
  const childWithKeyRegex = /(<\w+[^>]*)(\s+:key="([^"]+)")([^>]*>)/g;
  let updatedContent = templateContent;
  let movedKey = null;

  updatedContent = updatedContent.replace(childWithKeyRegex, (childMatch, beforeKey, keyAttr, keyValue, afterKey) => {
    if (!hasKeyOnTemplate && !movedKey) {
    // Move the first encountered :key to the template
      movedKey = keyValue;
    }

    // Remove :key from child element
    return `${ beforeKey }${ afterKey }`;
  });

  if (!hasKeyOnTemplate && movedKey) {
  // Add :key to the <template> tag
    const updatedTemplateStart = `${ addKeyAttribute(templateStart.replace(/>$/, ''), movedKey) }>`;

    return `${ updatedTemplateStart }${ updatedContent }${ templateEnd }`;
  }

  return `${ templateStart }${ updatedContent }${ templateEnd }`;
};
const vueTemplateKeyRemoval = (match, templateStart, templateContent, templateEnd) => {
  const childWithKeyRegex = /(<\w+[^>]*)(\s+:key="[^"]+")([^>]*>)/g;
  const updatedContent = templateContent.replace(childWithKeyRegex, '$1$3');

  return `${ templateStart }${ updatedContent }${ templateEnd }`;
};

module.exports = {
  isSimpleIdentifier,
  isBracketedExpression,
  isStringLiteral,
  extractKeyExpression,
  addKeyAttribute,
  vueSetReplacement,
  vueDeleteReplacement,
  vueKeyReplacement,
  vueTemplateKeyReplacement,
  vueTemplateKeyRemoval
};
