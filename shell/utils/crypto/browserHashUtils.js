import { Buffer } from 'buffer';

function hashString(str) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);

    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  return new Uint32Array([hash])[0].toString(36);
}

// Quick, simple hash function to generate hash for an object
export function hashObj(obj) {
  return hashString(JSON.stringify(obj, null, 2));
}

/**
 * @api private
 */
export function isEmptyData(data) {
  if (typeof data === 'string') {
    return data.length === 0;
  }

  return data.byteLength === 0;
}

/**
 * @api private
 */
export function convertToBuffer(data) {
  if (typeof data === 'string') {
    // eslint-disable-next-line node/no-deprecated-api
    data = new Buffer(data, 'utf8');
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }

  return new Uint8Array(data);
}

export default {
  isEmptyData,
  convertToBuffer,
};
