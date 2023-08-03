var boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

import {
  BufferEncoder,
  BufferDecoder
} from "./buffer.js";

export var BufferObject = (function() {
  class BufferObject extends DataView {
    constructor(object = {}, maxByteLength = 1e6) {
      var key, val;
      super(new ArrayBuffer(0, {maxByteLength}));
      this.write = this.write.bind(this);
      this.find = this.find.bind(this);
      for (key in object) {
        val = object[key];
        this.write(key, val);
      }
      return new Proxy(this, {
        set: BufferObject.__setter__,
        get: BufferObject.__getter__
      });
    }

    resize(byteLength) {
      if (!(this.buffer.maxByteLength > byteLength)) {
        throw ["Max byte length exceed!", this.buffer.maxByteLength, byteLength, this];
      }
      this.buffer.resize(byteLength);
      return this;
    }

    write(key, val, match) {
      var byteLength, diffBytes, endOffset, i, j, k, keyBuffer, l, len, len1, len2, len3, len4, m, n, o, offset, p, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, v, valBuffer, valLength, valOffset;
      boundMethodCheck(this, BufferObject);
      valBuffer = this.encoder.encode(val);
      valLength = valBuffer.byteLength;
      if (match == null) {
        keyBuffer = this.encoder.encode(key);
        byteLength = (offset = this.byteLength) + keyBuffer.byteLength + valBuffer.byteLength;
        this.resize(byteLength);
        ref = new Uint8Array(keyBuffer);
        for (j = 0, len = ref.length; j < len; j++) {
          v = ref[j];
          this.setUint8(offset++, v);
        }
        ref1 = new Uint8Array(valBuffer);
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          v = ref1[k];
          this.setUint8(offset++, v);
        }
        return this;
      }
      [offset, valOffset, endOffset] = match;
      (diffBytes = valLength - (endOffset - valOffset));
      if (!diffBytes) {
        ref2 = new Uint8Array(valBuffer);
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          v = ref2[l];
          this.setUint8(valOffset++, v);
        }
      } else if (diffBytes > 0) {
        this.resize(this.byteLength + diffBytes);
        for (i = m = ref3 = this.byteLength - 1, ref4 = endOffset; (ref3 <= ref4 ? m < ref4 : m > ref4); i = ref3 <= ref4 ? ++m : --m) {
          this.setUint8(i, this.getUint8(i - diffBytes));
        }
        ref5 = new Uint8Array(valBuffer);
        for (n = 0, len3 = ref5.length; n < len3; n++) {
          v = ref5[n];
          this.setUint8(valOffset++, v);
        }
      } else if (diffBytes < 0) {
        ref6 = new Uint8Array(valBuffer);
        for (o = 0, len4 = ref6.length; o < len4; o++) {
          v = ref6[o];
          this.setUint8(valOffset++, v);
        }
        for (i = p = ref7 = valOffset, ref8 = this.byteLength; (ref7 <= ref8 ? p < ref8 : p > ref8); i = ref7 <= ref8 ? ++p : --p) {
          this.setUint8(i, this.getUint8(i + diffBytes));
        }
        this.resize(this.byteLength - diffBytes);
      }
      return this;
    }

    decode(start, end) {
      return this.decoder.decode(this.buffer.slice(start, end));
    }

    find(key, offset = 0, byteLength = this.byteLength) {
      var endOffset, keyLength, keyOffset, valLength, valOffset;
      boundMethodCheck(this, BufferObject);
      if (!(offset < byteLength)) {
        return;
      }
      if (!this.getUint8(offset)) {
        return;
      }
      keyOffset = offset;
      keyLength = this.getUint16(offset + 1);
      valOffset = keyOffset + 3 + keyLength;
      valLength = this.getUint16(1 + valOffset);
      endOffset = valOffset + 3 + valLength;
      if (key === this.decode(keyOffset, valOffset)) {
        return [offset, valOffset, endOffset];
      }
      return this.find(key, endOffset);
    }

    static __setter__(view, key, value, proxy) {
      return view.write(key, value, view.find(key));
    }

    static __getter__(view, key, proxy) {
      var result;
      if (!(result = view.find(key))) {
        return;
      }
      return view.decode(result[1], result[2]);
    }

  };

  BufferObject.prototype.encoder = new BufferEncoder();

  BufferObject.prototype.decoder = new BufferDecoder();

  return BufferObject;

}).call(this);
