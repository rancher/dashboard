import { Buffer } from 'buffer';
import { isEmptyData, convertToBuffer } from './browserHashUtils';

const BLOCK_SIZE = 64;

const DIGEST_LENGTH = 16;

/**
 * @api private
 */
function Md5() {
  this.state = [
    0x67452301,
    0xEFCDAB89,
    0x98BADCFE,
    0x10325476,
  ];
  this.buffer = new DataView(new ArrayBuffer(BLOCK_SIZE));
  this.bufferLength = 0;
  this.bytesHashed = 0;
  this.finished = false;
}

/**
 * @api private
 */
export default Md5;

Md5.BLOCK_SIZE = BLOCK_SIZE;

Md5.prototype.update = function(sourceData) {
  if (isEmptyData(sourceData)) {
    return this;
  } else if (this.finished) {
    throw new Error('Attempted to update an already finished hash.');
  }

  const data = convertToBuffer(sourceData);
  let position = 0;
  let byteLength = data.byteLength;

  this.bytesHashed += byteLength;
  while (byteLength > 0) {
    this.buffer.setUint8(this.bufferLength++, data[position++]);
    byteLength--;
    if (this.bufferLength === BLOCK_SIZE) {
      this.hashBuffer();
      this.bufferLength = 0;
    }
  }

  return this;
};

Md5.prototype.digest = function(encoding) {
  if (!this.finished) {
    const _a = this; const buffer = _a.buffer; const undecoratedLength = _a.bufferLength; const bytesHashed = _a.bytesHashed;
    const bitsHashed = bytesHashed * 8;

    buffer.setUint8(this.bufferLength++, 128);
    // Ensure the final block has enough room for the hashed length
    if (undecoratedLength % BLOCK_SIZE >= BLOCK_SIZE - 8) {
      for (let i = this.bufferLength; i < BLOCK_SIZE; i++) {
        buffer.setUint8(i, 0);
      }
      this.hashBuffer();
      this.bufferLength = 0;
    }
    for (let i = this.bufferLength; i < BLOCK_SIZE - 8; i++) {
      buffer.setUint8(i, 0);
    }
    buffer.setUint32(BLOCK_SIZE - 8, bitsHashed >>> 0, true);
    buffer.setUint32(BLOCK_SIZE - 4, Math.floor(bitsHashed / 0x100000000), true);
    this.hashBuffer();
    this.finished = true;
  }
  const out = new DataView(new ArrayBuffer(DIGEST_LENGTH));

  for (let i = 0; i < 4; i++) {
    out.setUint32(i * 4, this.state[i], true);
  }

  // eslint-disable-next-line node/no-deprecated-api, unicorn/no-new-buffer
  const buff = new Buffer(out.buffer, out.byteOffset, out.byteLength);

  return encoding ? buff.toString(encoding) : buff;
};

Md5.prototype.hashBuffer = function() {
  const _a = this; const buffer = _a.buffer; const state = _a.state;
  let a = state[0]; let b = state[1]; let c = state[2]; let d = state[3];

  a = ff(a, b, c, d, buffer.getUint32(0, true), 7, 0xD76AA478);
  d = ff(d, a, b, c, buffer.getUint32(4, true), 12, 0xE8C7B756);
  c = ff(c, d, a, b, buffer.getUint32(8, true), 17, 0x242070DB);
  b = ff(b, c, d, a, buffer.getUint32(12, true), 22, 0xC1BDCEEE);
  a = ff(a, b, c, d, buffer.getUint32(16, true), 7, 0xF57C0FAF);
  d = ff(d, a, b, c, buffer.getUint32(20, true), 12, 0x4787C62A);
  c = ff(c, d, a, b, buffer.getUint32(24, true), 17, 0xA8304613);
  b = ff(b, c, d, a, buffer.getUint32(28, true), 22, 0xFD469501);
  a = ff(a, b, c, d, buffer.getUint32(32, true), 7, 0x698098D8);
  d = ff(d, a, b, c, buffer.getUint32(36, true), 12, 0x8B44F7AF);
  c = ff(c, d, a, b, buffer.getUint32(40, true), 17, 0xFFFF5BB1);
  b = ff(b, c, d, a, buffer.getUint32(44, true), 22, 0x895CD7BE);
  a = ff(a, b, c, d, buffer.getUint32(48, true), 7, 0x6B901122);
  d = ff(d, a, b, c, buffer.getUint32(52, true), 12, 0xFD987193);
  c = ff(c, d, a, b, buffer.getUint32(56, true), 17, 0xA679438E);
  b = ff(b, c, d, a, buffer.getUint32(60, true), 22, 0x49B40821);
  a = gg(a, b, c, d, buffer.getUint32(4, true), 5, 0xF61E2562);
  d = gg(d, a, b, c, buffer.getUint32(24, true), 9, 0xC040B340);
  c = gg(c, d, a, b, buffer.getUint32(44, true), 14, 0x265E5A51);
  b = gg(b, c, d, a, buffer.getUint32(0, true), 20, 0xE9B6C7AA);
  a = gg(a, b, c, d, buffer.getUint32(20, true), 5, 0xD62F105D);
  d = gg(d, a, b, c, buffer.getUint32(40, true), 9, 0x02441453);
  c = gg(c, d, a, b, buffer.getUint32(60, true), 14, 0xD8A1E681);
  b = gg(b, c, d, a, buffer.getUint32(16, true), 20, 0xE7D3FBC8);
  a = gg(a, b, c, d, buffer.getUint32(36, true), 5, 0x21E1CDE6);
  d = gg(d, a, b, c, buffer.getUint32(56, true), 9, 0xC33707D6);
  c = gg(c, d, a, b, buffer.getUint32(12, true), 14, 0xF4D50D87);
  b = gg(b, c, d, a, buffer.getUint32(32, true), 20, 0x455A14ED);
  a = gg(a, b, c, d, buffer.getUint32(52, true), 5, 0xA9E3E905);
  d = gg(d, a, b, c, buffer.getUint32(8, true), 9, 0xFCEFA3F8);
  c = gg(c, d, a, b, buffer.getUint32(28, true), 14, 0x676F02D9);
  b = gg(b, c, d, a, buffer.getUint32(48, true), 20, 0x8D2A4C8A);
  a = hh(a, b, c, d, buffer.getUint32(20, true), 4, 0xFFFA3942);
  d = hh(d, a, b, c, buffer.getUint32(32, true), 11, 0x8771F681);
  c = hh(c, d, a, b, buffer.getUint32(44, true), 16, 0x6D9D6122);
  b = hh(b, c, d, a, buffer.getUint32(56, true), 23, 0xFDE5380C);
  a = hh(a, b, c, d, buffer.getUint32(4, true), 4, 0xA4BEEA44);
  d = hh(d, a, b, c, buffer.getUint32(16, true), 11, 0x4BDECFA9);
  c = hh(c, d, a, b, buffer.getUint32(28, true), 16, 0xF6BB4B60);
  b = hh(b, c, d, a, buffer.getUint32(40, true), 23, 0xBEBFBC70);
  a = hh(a, b, c, d, buffer.getUint32(52, true), 4, 0x289B7EC6);
  d = hh(d, a, b, c, buffer.getUint32(0, true), 11, 0xEAA127FA);
  c = hh(c, d, a, b, buffer.getUint32(12, true), 16, 0xD4EF3085);
  b = hh(b, c, d, a, buffer.getUint32(24, true), 23, 0x04881D05);
  a = hh(a, b, c, d, buffer.getUint32(36, true), 4, 0xD9D4D039);
  d = hh(d, a, b, c, buffer.getUint32(48, true), 11, 0xE6DB99E5);
  c = hh(c, d, a, b, buffer.getUint32(60, true), 16, 0x1FA27CF8);
  b = hh(b, c, d, a, buffer.getUint32(8, true), 23, 0xC4AC5665);
  a = ii(a, b, c, d, buffer.getUint32(0, true), 6, 0xF4292244);
  d = ii(d, a, b, c, buffer.getUint32(28, true), 10, 0x432AFF97);
  c = ii(c, d, a, b, buffer.getUint32(56, true), 15, 0xAB9423A7);
  b = ii(b, c, d, a, buffer.getUint32(20, true), 21, 0xFC93A039);
  a = ii(a, b, c, d, buffer.getUint32(48, true), 6, 0x655B59C3);
  d = ii(d, a, b, c, buffer.getUint32(12, true), 10, 0x8F0CCC92);
  c = ii(c, d, a, b, buffer.getUint32(40, true), 15, 0xFFEFF47D);
  b = ii(b, c, d, a, buffer.getUint32(4, true), 21, 0x85845DD1);
  a = ii(a, b, c, d, buffer.getUint32(32, true), 6, 0x6FA87E4F);
  d = ii(d, a, b, c, buffer.getUint32(60, true), 10, 0xFE2CE6E0);
  c = ii(c, d, a, b, buffer.getUint32(24, true), 15, 0xA3014314);
  b = ii(b, c, d, a, buffer.getUint32(52, true), 21, 0x4E0811A1);
  a = ii(a, b, c, d, buffer.getUint32(16, true), 6, 0xF7537E82);
  d = ii(d, a, b, c, buffer.getUint32(44, true), 10, 0xBD3AF235);
  c = ii(c, d, a, b, buffer.getUint32(8, true), 15, 0x2AD7D2BB);
  b = ii(b, c, d, a, buffer.getUint32(36, true), 21, 0xEB86D391);
  state[0] = (a + state[0]) & 0xFFFFFFFF;
  state[1] = (b + state[1]) & 0xFFFFFFFF;
  state[2] = (c + state[2]) & 0xFFFFFFFF;
  state[3] = (d + state[3]) & 0xFFFFFFFF;
};

function cmn(q, a, b, x, s, t) {
  a = (((a + q) & 0xFFFFFFFF) + ((x + t) & 0xFFFFFFFF)) & 0xFFFFFFFF;

  return (((a << s) | (a >>> (32 - s))) + b) & 0xFFFFFFFF;
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}
