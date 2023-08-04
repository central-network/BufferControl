export class BufferEncoder

	__proto__ 	: null
	encode 		: ( object ) ->

		f32i = new Array()
		data = new Array()
		byte = 0

		encode = ( value ) ->
			byte = ( offset = byte ) + 3

			unless value?

				data[ offset ] = 4
				data[ byte++ ] = 1 * (value isnt null)

			else switch value.constructor

				when Object
					for key of value
						encode key
						encode value[ key ]
					data[ offset ] = 1

				when Array
					value.forEach encode
					data[ offset ] = 2

				when Boolean
					data[ byte++ ] = value * 1
					data[ offset ] = 3

				when String
					for c in value
						code = c.charCodeAt 0 
						data[ byte++ ] = code >>> 8 & 0xff 
						data[ byte++ ] = code & 0xff 
					data[ offset ] = 5

				when Number
					for c in value.toString()
						data[ byte++ ] = c.charCodeAt 0 
					data[ offset ] = 6

				when Float32Array
					data[ offset ] = 8
					for v in value
						f32i[ byte ] = v
						byte = byte + 4

				when Uint32Array
					for v, i in value
						data[ byte++ ] = v >>> 24 & 0xff
						data[ byte++ ] = v >>> 16 & 0xff
						data[ byte++ ] = v >>> 8 & 0xff
						data[ byte++ ] = v & 0xff
					data[ offset ] = 9

				when Uint16Array
					for v, i in value
						data[ byte++ ] = v >>> 8 & 0xff
						data[ byte++ ] = v & 0xff
					data[ offset ] = 10

				when Uint8Array
					for v, i in value
						data[ byte++ ] = v & 0xff
					data[ offset ] = 11

				else 
					if  value instanceof Node 
						byte = byte - 3
						encode value.id
						data[ offset ] = 7


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
				writer.setFloat32 byte, val
				
			else if val = data[ byte ]
				writer.setUint8 byte, val

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

				when 1
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

				when 2
					array = new Array()

					while size

						length = @getUint16 byte + 1
						length and array[ array.length
						] = decode.call this, byte, length
						
						byte = byte + length + 3
						size = size - length - 3

					array

				when 3
					1 is @getUint8 byte++

				when 4
					if 0 is @getUint8 byte++
					then null else undefined

				when 5
					text = ""
					while size--
						text = text + String.fromCharCode(
							@getUint16 byte++ 
						)
						byte++ ; size--
					text

				when 6
					text = "" ; while size--
						text = text + String.fromCharCode(
							@getUint8 byte++ 
						)
					Number text
					
				when 7
					document.getElementById decode.call this, byte-3, size, 5
					
				when 8
					bytes = Float32Array.BYTES_PER_ELEMENT
					count = size / bytes
					array = new Float32Array count
					index = 0

					while count--
						array[ index++ ] = @getFloat32 byte
						byte = byte + bytes

					array

				when 9
					bytes = Uint32Array.BYTES_PER_ELEMENT
					count = size / bytes
					array = new Uint32Array count
					index = 0

					while count--
						array[ index++ ] =
							@getUint32 byte
						byte = byte + bytes

					array

				when 10
					bytes = Uint16Array.BYTES_PER_ELEMENT
					count = size / bytes
					array = new Uint16Array count
					index = 0

					while count--
						array[ index++ ] =
							@getUint16 byte
						byte = byte + bytes

					array

				when 11
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

	@decodeString	= ( buffer, start, end ) ->
		

export default defineProperties = ->
    Object.defineProperty Object::, "buffer", get : ->
        new BufferEncoder().encode( this )

    Object.defineProperties ArrayBuffer::, {
        buffer : value : null
        object : get : -> BufferDecoder::decode @ 
    }

    delete ArrayBuffer.buffer
