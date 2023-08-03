var defineProperties,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

export var BufferEncoder = (function() {
  class BufferEncoder {
    encode(object) {
      var buffer, byte, data, encode, f32i, val, writer;
      f32i = new Array();
      data = new Array();
      byte = 0;
      encode = function(value) {
        var byteLength, c, code, i, j, k, key, l, len, len1, len2, len3, len4, m, n, offset, v;
        byte = (offset = byte) + 3;
        if (value == null) {
          data[offset] = 3;
          data[byte++] = 1 * (value !== null);
        } else {
          switch (value.constructor) {
            case Object:
              for (key in value) {
                encode(key);
                encode(value[key]);
              }
              break;
            case Array:
              value.forEach(encode);
              data[offset] = 1;
              break;
            case Boolean:
              data[byte++] = value * 1;
              data[offset] = 2;
              break;
            case String:
              for (j = 0, len = value.length; j < len; j++) {
                c = value[j];
                code = 42 + c.charCodeAt(0);
                data[byte++] = code >>> 8 & 0xff;
                data[byte++] = code & 0xff;
              }
              data[offset] = 4;
              break;
            case Number:
              byte = byte - 3;
              encode(value.toString());
              data[offset] = 5;
              break;
            case Float32Array:
              data[offset] = 7;
              for (k = 0, len1 = value.length; k < len1; k++) {
                v = value[k];
                f32i[byte] = v;
                byte = byte + 4;
              }
              break;
            case Uint32Array:
              for (i = l = 0, len2 = value.length; l < len2; i = ++l) {
                v = value[i];
                data[byte++] = v >>> 24 & 0xff;
                data[byte++] = v >>> 16 & 0xff;
                data[byte++] = v >>> 8 & 0xff;
                data[byte++] = v & 0xff;
              }
              data[offset] = 8;
              break;
            case Uint16Array:
              for (i = m = 0, len3 = value.length; m < len3; i = ++m) {
                v = value[i];
                data[byte++] = v >>> 8 & 0xff;
                data[byte++] = v & 0xff;
              }
              data[offset] = 9;
              break;
            case Uint8Array:
              for (i = n = 0, len4 = value.length; n < len4; i = ++n) {
                v = value[i];
                data[byte++] = v & 0xff;
              }
              data[offset] = 10;
              break;
            default:
              if (value instanceof Node) {
                byte = byte - 3;
                encode(value.id);
                data[offset] = 6;
              }
          }
        }
        byteLength = byte - offset - 3;
        data[offset + 1] = byteLength >> 8;
        data[offset + 2] = byteLength & 0xff;
        return byte;
      };
      writer = new DataView(new ArrayBuffer(encode(object)));
      while (byte--) {
        if (val = f32i[byte]) {
          writer.setFloat32(byte, val);
        } else {
          writer.setUint8(byte, data[byte]);
        }
      }
      data.length = 0;
      buffer = writer.buffer;
      writer = null;
      return buffer;
    }

  };

  BufferEncoder.prototype.__proto__ = null;

  return BufferEncoder;

}).call(this);

export var BufferDecoder = (function() {
  class BufferDecoder {
    decode(buffer) {
      var data, decode, view;
      data = (decode = function(byte, size, type) {
        var array, bytes, count, index, keyLength, keyOffset, length, object, text, valLength, valOffset;
        type = type != null ? type : this.getUint8(byte);
        size = size != null ? size : this.getUint16(byte + 1);
        byte = byte + 3;
        switch (type) {
          case 0:
            object = new Object();
            while (size) {
              keyOffset = byte;
              keyLength = this.getUint16(keyOffset + 1);
              valOffset = keyOffset + keyLength + 3;
              valLength = this.getUint16(valOffset + 1);
              object[decode.call(this, keyOffset, keyLength)] = !valLength ? null : decode.call(this, valOffset, valLength);
              byte = byte + keyLength + valLength + 6;
              size = size - keyLength - valLength - 6;
            }
            return object;
          case 1:
            array = new Array();
            while (size) {
              length = this.getUint16(byte + 1);
              length && (array[array.length] = decode.call(this, byte, length));
              byte = byte + length + 3;
              size = size - length - 3;
            }
            return array;
          case 2:
            return 1 === this.getUint8(byte++);
          case 3:
            if (0 === this.getUint8(byte++)) {
              return null;
            } else {
              return void 0;
            }
            break;
          case 4:
            text = "";
            while (size--) {
              text = text + String.fromCharCode(this.getUint16(byte++) - 42);
              byte++;
              size--;
            }
            return text;
          case 5:
            return Number(decode.call(this, byte - 3, size, 4));
          case 6:
            return document.getElementById(decode.call(this, byte - 3, size, 4));
          case 7:
            bytes = Float32Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Float32Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getFloat32(byte);
              byte = byte + bytes;
            }
            return array;
          case 8:
            bytes = Uint32Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Uint32Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getUint32(byte);
              byte = byte + bytes;
            }
            return array;
          case 9:
            bytes = Uint16Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Uint16Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getUint16(byte);
              byte = byte + bytes;
            }
            return array;
          case 10:
            bytes = Uint8Array.BYTES_PER_ELEMENT;
            count = size / bytes;
            array = new Uint8Array(count);
            index = 0;
            while (count--) {
              array[index++] = this.getUint8(byte);
              byte = byte + bytes;
            }
            return array;
          default:
            return void 0;
        }
      }).call(view = new DataView(buffer), 0);
      view = null;
      return data;
    }

  };

  BufferDecoder.prototype.__proto__ = null;

  return BufferDecoder;

}).call(this);

export var BufferObject = (function() {
  class BufferObject extends DataView {
    constructor(object = {}, byteLength = 2048) {
      var OFFSET, SIZE, TYPE, key, val;
      super(new ArrayBuffer(byteLength));
      this.write = this.write.bind(this);
      this.findKey = this.findKey.bind(this);
      this.setUint16(0, TYPE = 1245);
      this.setUint32(2, OFFSET = 12);
      this.setUint32(6, SIZE = byteLength - OFFSET);
      for (key in object) {
        val = object[key];
        this.write(key, val);
      }
      return new Proxy(this, {
        set: BufferObject.__setter__,
        get: function(v, key) {
          return v.findKey(key);
        }
      });
    }

    allocate(byteLength = 0, offset = this.offset) {
      if (!(this.byteLength > offset + byteLength)) {
        throw ["Buffer object has no more space to allocate!", {arguments}];
      }
      this.offset = offset + byteLength;
      return offset;
    }

    write(key, val) {
      var j, k, keyBuffer, len, len1, offset, r, ref, ref1, totalByte, v, valBuffer;
      boundMethodCheck(this, BufferObject);
      keyBuffer = this.encoder.encode(key);
      valBuffer = this.encoder.encode(val);
      totalByte = keyBuffer.byteLength + valBuffer.byteLength;
      if (!(r = offset = this.allocate(keyBuffer.byteLength + valBuffer.byteLength))) {
        return;
      }
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

    decode(start, end) {
      return this.decoder.decode(this.buffer.slice(start, end));
    }

    findKey(key, offset = 12) {
      var endOffset, keyLength, keyOffset, valLength, valOffset;
      boundMethodCheck(this, BufferObject);
      if (offset > this.byteLength) {
        return;
      }
      keyOffset = offset;
      keyLength = this.getUint16(offset + 1);
      if (!keyLength) {
        return;
      }
      valOffset = keyOffset + 3 + keyLength;
      valLength = this.getUint16(1 + valOffset);
      endOffset = valOffset + 3 + valLength;
      if (key === this.decode(keyOffset, valOffset)) {
        return this.decode(valOffset, endOffset);
      }
      return this.findKey(key, endOffset);
    }

    static __setter__(view, key, value, proxy) {
      var buf;
      if (!view.findKey(key)) {
        buf = view.write(key, value);
        console.log(`buf has no key: '${key}' new written`);
      }
      return value;
    }

    static __getter__(view, key, proxy) {
      return view.findKey(key);
    }

  };

  BufferObject.prototype.encoder = new BufferEncoder();

  BufferObject.prototype.decoder = new BufferDecoder();

  return BufferObject;

}).call(this);

Object.defineProperties(BufferObject.prototype, {
  length: {
    get: function() {
      return this.getUint32(6);
    },
    set: function() {
      this.setUint32(6, arguments[0]);
      return this.length;
    }
  },
  offset: {
    get: function() {
      return this.getUint32(2);
    },
    set: function() {
      this.setUint32(2, arguments[0]);
      return this.offset;
    }
  }
});

export default defineProperties = function() {
  Object.defineProperty(Object.prototype, "buffer", {
    get: function() {
      return new BufferEncoder().encode(this);
    }
  });
  Object.defineProperties(ArrayBuffer.prototype, {
    buffer: {
      value: null
    },
    object: {
      get: function() {
        return BufferDecoder.prototype.decode(this);
      }
    }
  });
  return delete ArrayBuffer.buffer;
};
