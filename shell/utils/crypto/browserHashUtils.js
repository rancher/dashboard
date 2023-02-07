import { Buffer } from 'buffer';

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
    // eslint-disable-next-line node/no-deprecated-api, unicorn/no-new-buffer
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
