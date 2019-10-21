import { Buffer } from 'buffer';
import { isEmptyData, convertToBuffer } from './browserHashUtils';

const BLOCK_SIZE = 64;
const DIGEST_LENGTH = 20;

/**
 * @api private
 */
function Sha1() {
  this.h0 = 0x67452301;
  this.h1 = 0xEFCDAB89;
  this.h2 = 0x98BADCFE;
  this.h3 = 0x10325476;
  this.h4 = 0xC3D2E1F0;
  // The first 64 bytes (16 words) is the data chunk
  this.block = new Uint32Array(80);
  this.offset = 0;
  this.shift = 24;
  this.totalLength = 0;
}

/**
 * @api private
 */
export default Sha1;

Sha1.BLOCK_SIZE = BLOCK_SIZE;

Sha1.prototype.update = function(data) {
  if (this.finished) {
    throw new Error('Attempted to update an already finished hash.');
  }

  if (isEmptyData(data)) {
    return this;
  }

  data = convertToBuffer(data);

  const length = data.length;

  this.totalLength += length * 8;
  for (let i = 0; i < length; i++) {
    this.write(data[i]);
  }

  return this;
};

Sha1.prototype.write = function write(byte) {
  this.block[this.offset] |= (byte & 0xFF) << this.shift;
  if (this.shift) {
    this.shift -= 8;
  } else {
    this.offset++;
    this.shift = 24;
  }

  if (this.offset === 16) {
    this.processBlock();
  }
};

Sha1.prototype.digest = function(encoding) {
  // Pad
  this.write(0x80);
  if (this.offset > 14 || (this.offset === 14 && this.shift < 24)) {
    this.processBlock();
  }
  this.offset = 14;
  this.shift = 24;

  // 64-bit length big-endian
  this.write(0x00); // numbers this big aren't accurate in javascript anyway
  this.write(0x00); // ..So just hard-code to zero.
  this.write(this.totalLength > 0xFFFFFFFFFF ? this.totalLength / 0x10000000000 : 0x00);
  this.write(this.totalLength > 0xFFFFFFFF ? this.totalLength / 0x100000000 : 0x00);
  for (let s = 24; s >= 0; s -= 8) {
    this.write(this.totalLength >> s);
  }
  // The value in state is little-endian rather than big-endian, so flip
  // each word into a new Uint8Array
  // eslint-disable-next-line node/no-deprecated-api, unicorn/no-new-buffer
  const out = new Buffer(DIGEST_LENGTH);
  const outView = new DataView(out.buffer);

  outView.setUint32(0, this.h0, false);
  outView.setUint32(4, this.h1, false);
  outView.setUint32(8, this.h2, false);
  outView.setUint32(12, this.h3, false);
  outView.setUint32(16, this.h4, false);

  return encoding ? out.toString(encoding) : out;
};

Sha1.prototype.processBlock = function processBlock() {
  // Extend the sixteen 32-bit words into eighty 32-bit words:
  for (let i = 16; i < 80; i++) {
    const w = this.block[i - 3] ^ this.block[i - 8] ^ this.block[i - 14] ^ this.block[i - 16];

    this.block[i] = (w << 1) | (w >>> 31);
  }

  // Initialize hash value for this chunk:
  let a = this.h0;
  let b = this.h1;
  let c = this.h2;
  let d = this.h3;
  let e = this.h4;
  let f, k;

  // Main loop:
  for (let i = 0; i < 80; i++) {
    if (i < 20) {
      f = d ^ (b & (c ^ d));
      k = 0x5A827999;
    } else if (i < 40) {
      f = b ^ c ^ d;
      k = 0x6ED9EBA1;
    } else if (i < 60) {
      f = (b & c) | (d & (b | c));
      k = 0x8F1BBCDC;
    } else {
      f = b ^ c ^ d;
      k = 0xCA62C1D6;
    }
    const temp = (a << 5 | a >>> 27) + f + e + k + (this.block[i] | 0);

    e = d;
    d = c;
    c = (b << 30 | b >>> 2);
    b = a;
    a = temp;
  }

  // Add this chunk's hash to result so far:
  this.h0 = (this.h0 + a) | 0;
  this.h1 = (this.h1 + b) | 0;
  this.h2 = (this.h2 + c) | 0;
  this.h3 = (this.h3 + d) | 0;
  this.h4 = (this.h4 + e) | 0;

  // The block is now reusable.
  this.offset = 0;
  for (let i = 0; i < 16; i++) {
    this.block[i] = 0;
  }
};
