import { BufferEncoder, BufferDecoder } from "./buffer.js"

export class BufferObject extends DataView

	encoder 	: new BufferEncoder()
	decoder		: new BufferDecoder()

	constructor : ( object = {}, maxByteLength = 1e6 ) ->
		super new ArrayBuffer 0, { maxByteLength }

		for key, val of object
			@write key, val

		return new Proxy this, {
			set : BufferObject.__setter__
			get : BufferObject.__getter__
		}

	resize		: ( byteLength ) ->
		unless @buffer.maxByteLength > byteLength
			throw [ "Max byte length exceed!", 
			@buffer.maxByteLength, byteLength, @ ]

		@buffer.resize byteLength ; @ 

	write		: ( key, val, match ) =>
		valBuffer = @encoder.encode val
		valLength = valBuffer.byteLength

		unless match?
			keyBuffer = @encoder.encode key
			
			byteLength = (
				(offset = @byteLength) + 
				(keyBuffer.byteLength) + 
				(valBuffer.byteLength)
			)

			@resize byteLength

			for v in new Uint8Array keyBuffer
				@setUint8 offset++, v

			for v in new Uint8Array valBuffer
				@setUint8 offset++, v

			return this



		[ offset , valOffset , endOffset ] = match
		( diffBytes = valLength - ( endOffset - valOffset ) )

		unless diffBytes

			for v in new Uint8Array valBuffer
				@setUint8 valOffset++, v

		else if diffBytes > 0

			@resize @byteLength + diffBytes

			for i in [ @byteLength-1 ... endOffset ]
				@setUint8 i, @getUint8 i - diffBytes

			for v in new Uint8Array valBuffer
				@setUint8 valOffset++, v
			

		else if diffBytes < 0
			for v in new Uint8Array valBuffer
				@setUint8 valOffset++, v
			
			for i in [ valOffset ... @byteLength ]
				@setUint8 i, @getUint8 i + diffBytes

			@resize @byteLength - diffBytes

		return this


	decode		: ( start, end ) ->
		@decoder.decode @buffer.slice start, end

	find		: ( key, offset = 0, byteLength = @byteLength ) =>
		return unless offset < byteLength
		return unless @getUint8 offset

		keyOffset = offset
		keyLength = @getUint16 offset + 1

		valOffset = keyOffset + 3 + keyLength
		valLength = @getUint16  1 + valOffset 

		endOffset = valOffset + 3 + valLength

		if  key is @decode keyOffset, valOffset 
			return [ offset, valOffset, endOffset ]

		@find key, endOffset


	@__setter__	= ( view, key, value, proxy )	=>
		view.write key, value, view.find key

	@__getter__	= ( view, key, proxy ) =>
		return unless result = view.find key
		return view.decode result[1], result[2]
		