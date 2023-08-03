export class BufferEncoder

	__proto__ 	: null
	encode 		: ( object ) ->

		f32i = new Array()
		data = new Array()
		byte = 0

		encode = ( value ) ->
			byte = ( offset = byte ) + 3

			unless value?

				data[ offset ] = 3
				data[ byte++ ] = 1 * (value isnt null)

			else switch value.constructor

				when Object
					for key of value
						encode key
						encode value[ key ]

				when Array
					value.forEach encode
					data[ offset ] = 1

				when Boolean
					data[ byte++ ] = value * 1
					data[ offset ] = 2

				when String
					for c in value
						code = 42 + c.charCodeAt 0 
						data[ byte++ ] = code >>> 8 & 0xff 
						data[ byte++ ] = code & 0xff 
					data[ offset ] = 4

				when Number
					byte = byte - 3
					encode value.toString()
					data[ offset ] = 5

				when Float32Array
					data[ offset ] = 7
					for v in value
						f32i[ byte ] = v
						byte = byte + 4

				when Uint32Array
					for v, i in value
						data[ byte++ ] = v >>> 24 & 0xff
						data[ byte++ ] = v >>> 16 & 0xff
						data[ byte++ ] = v >>> 8 & 0xff
						data[ byte++ ] = v & 0xff
					data[ offset ] = 8

				when Uint16Array
					for v, i in value
						data[ byte++ ] = v >>> 8 & 0xff
						data[ byte++ ] = v & 0xff
					data[ offset ] = 9

				when Uint8Array
					for v, i in value
						data[ byte++ ] = v & 0xff
					data[ offset ] = 10

				else 
					if  value instanceof Node 
						byte = byte - 3
						encode value.id
						data[ offset ] = 6


			byteLength = byte - offset - 3
			data[ offset + 1 ] = byteLength >> 8
			data[ offset + 2 ] = byteLength & 0xff

			byte

		writer = new DataView(
			new ArrayBuffer(
				encode object
			)
		)

		while byte--

			if  val = f32i[ byte ]
				writer.setFloat32( byte, val )
				
			else
				writer.setUint8(
					byte, data[ byte ]
				)
				

		data.length = 0

		buffer = writer.buffer
		writer = null ; buffer 

export class BufferDecoder

	__proto__ 	: null
	decode 		: ( buffer ) ->
		data = ( decode = ( byte, size, type ) ->

			type = type ? @getUint8 byte
			size = size ? @getUint16 byte + 1
			byte = byte + 3

			switch type

				when 0
					object = new Object()

					while size

						keyOffset = byte
						keyLength = @getUint16 keyOffset + 1

						
						valOffset = keyOffset + keyLength + 3
						valLength = @getUint16 valOffset + 1

						object[ decode.call this, keyOffset, keyLength
						] = unless valLength then null
						else decode.call this, valOffset, valLength

						byte = byte + keyLength + valLength + 6
						size = size - keyLength - valLength - 6

					object

				when 1
					array = new Array()

					while size

						length = @getUint16 byte + 1
						length and array[ array.length
						] = decode.call this, byte, length
						
						byte = byte + length + 3
						size = size - length - 3

					array

				when 2
					1 is @getUint8 byte++

				when 3
					if 0 is @getUint8 byte++
					then null else undefined

				when 4
					text = ""
					while size--
						text = text + String.fromCharCode(
							@getUint16( byte++ ) - 42
						)
						byte++ ; size--
					text

				when 5
					Number decode.call this, byte-3, size, 4 
					
				when 6
					document.getElementById decode.call this, byte-3, size, 4
					
				when 7
					bytes = Float32Array.BYTES_PER_ELEMENT
					count = size / bytes
					array = new Float32Array count
					index = 0

					while count--
						array[ index++ ] = @getFloat32 byte
						byte = byte + bytes

					array

				when 8
					bytes = Uint32Array.BYTES_PER_ELEMENT
					count = size / bytes
					array = new Uint32Array count
					index = 0

					while count--
						array[ index++ ] =
							@getUint32 byte
						byte = byte + bytes

					array

				when 9
					bytes = Uint16Array.BYTES_PER_ELEMENT
					count = size / bytes
					array = new Uint16Array count
					index = 0

					while count--
						array[ index++ ] =
							@getUint16 byte
						byte = byte + bytes

					array

				when 10
					bytes = Uint8Array.BYTES_PER_ELEMENT
					count = size / bytes
					array = new Uint8Array count
					index = 0

					while count--
						array[ index++ ] =
							@getUint8 byte
						byte = byte + bytes

					array

				else undefined

		).call( view = new DataView( buffer ), 0 )

		view = null ; data

export class BufferObject extends DataView

	encoder 	: new BufferEncoder()
	decoder		: new BufferDecoder()

	constructor : ( object = {}, byteLength = 2048 ) ->
		super new ArrayBuffer byteLength

		@setUint16 0, TYPE = 1245
		@setUint32 2, OFFSET = 12
		@setUint32 6, SIZE = byteLength - OFFSET

		for key, val of object
			@write key, val

		return new Proxy this, {
			set : BufferObject.__setter__
			get : ( v, key ) -> v.findKey key 
		}

	allocate	: ( byteLength = 0, offset = @offset ) ->
		unless @byteLength > offset + byteLength
			throw [ "Buffer object has no more space to allocate!", { arguments } ]
		@offset = offset + byteLength ; offset

	write		: ( key, val ) =>
		keyBuffer = @encoder.encode key
		valBuffer = @encoder.encode val
		totalByte = keyBuffer.byteLength + valBuffer.byteLength

		return unless r = offset = @allocate(
			keyBuffer.byteLength + valBuffer.byteLength
		)

		for v in new Uint8Array keyBuffer
			@setUint8 offset++, v

		for v in new Uint8Array valBuffer
			@setUint8 offset++, v

		this

	decode		: ( start, end ) ->
		@decoder.decode @buffer.slice start, end

	findKey		: ( key, offset = 12 ) =>
		return if offset > @byteLength
		
		keyOffset = offset
		keyLength = @getUint16 offset + 1

		return unless keyLength

		valOffset = keyOffset + 3 + keyLength
		valLength = @getUint16  1 + valOffset 

		endOffset = valOffset + 3 + valLength

		if  key is @decode keyOffset, valOffset 
			return @decode valOffset, endOffset

		return @findKey key, endOffset


	@__setter__	= ( view, key, value, proxy )	=>
		unless view.findKey key
			buf = view.write key, value
			console.log "buf has no key: '#{key}' new written"
		return value;

	@__getter__	= ( view, key, proxy ) =>
		view.findKey key
		
Object.defineProperties BufferObject::, {
	length : 
		get : -> @getUint32 6 
		set : -> @setUint32 6, arguments[0] ; @length
	
	offset : 
		get : -> @getUint32 2
		set : -> @setUint32 2, arguments[0] ; @offset		
}

export default defineProperties = ->
    Object.defineProperty Object::, "buffer", get : ->
        new BufferEncoder().encode( this )

    Object.defineProperties ArrayBuffer::, {
        buffer : value : null
        object : get : -> BufferDecoder::decode @ 
    }

    delete ArrayBuffer.buffer

