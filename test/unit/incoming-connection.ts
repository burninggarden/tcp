import Net                from 'net';
import Tap                from 'tap';
import Message            from 'types/message';
import MessageType        from 'enums/message-type';
import ConnectionEvent    from 'enums/connection-event';
import MessageSerializer  from 'message-serializer';
import IncomingConnection from 'incoming-connection';
import {FileEncoding}     from '@burninggarden/enums';
import {StatusCode}       from '@burninggarden/http';
import {
	ErrorType,
	BaseError,
	InvalidMessageTypeError
} from '@burninggarden/errors';

class MockIncomingConnection extends IncomingConnection {
	protected getAllowedMessageTypes(): string[] {
		return ['foo', 'bar'];
	}
}

Tap.test('it allows incoming message with permitted type', test => {
	const outgoingMessage = {
		type           : 'foo',
		stringValue    : '123',
		numberValue    : 123.45,
		booleanValue   : false,
		nullValue      : null,
		arrayValue     : ['a', 'b', 'c'],
		objectValue: {
			key: 'value'
		}
	};

	const outgoingSocket = new Net.Socket();
	const port = 1234;

	const server = Net.createServer(socket => {
		const connection = (new MockIncomingConnection())
			.setSocket(socket);

		connection.on(ConnectionEvent.MESSAGE, (actualMessage: Message) => {
			test.deepEqual(actualMessage, outgoingMessage);

			outgoingSocket.end();
			server.close(test.end);
		});
	});

	server.listen(port, () => {
		const options = {
			port
		};

		const messageSerializer = new MessageSerializer(outgoingMessage);
		const serializedMessage = messageSerializer.serialize();

		outgoingSocket.connect(options, () => {
			outgoingSocket.write(serializedMessage);
		});
	});
});

Tap.test('it rejects incoming message with unpermitted type', test => {
	const outgoingMessage = {
		type           : 'wat',
		stringValue    : '123',
		numberValue    : 123.45,
		booleanValue   : false,
		nullValue      : null,
		arrayValue     : ['a', 'b', 'c'],
		objectValue: {
			key: 'value'
		}
	};

	const expectedMessage = (
		'Received unexpected value: wat ' +
		'(expected one of foo, bar)'
	);

	const expectedHash = {
		type:           ErrorType.INVALID_MESSAGE_TYPE,
		message:        expectedMessage,
		statusCode:     StatusCode.UNPROCESSABLE_ENTITY,
		actualValue:    'wat',
		expectedValues: ['foo', 'bar']
	};

	const outgoingSocket = new Net.Socket();
	const port = 1234;

	const server = Net.createServer(socket => {
		const connection = (new MockIncomingConnection())
			.setSocket(socket);

		connection.on(ConnectionEvent.ERROR, (error: BaseError) => {
			test.ok(error instanceof InvalidMessageTypeError);

			test.deepEqual(error.toHash(), expectedHash);
		});
	});

	server.listen(port, () => {
		const options = {
			port
		};

		const messageSerializer = new MessageSerializer(outgoingMessage);
		const serializedMessage = messageSerializer.serialize();

		outgoingSocket.connect(options, () => {
			outgoingSocket.write(serializedMessage);
		});

		outgoingSocket.on('data', (data: Buffer) => {
			const dataString = data.toString(FileEncoding.UTF8);
			const expectedMessage = {
				type:  MessageType.ERROR,
				error: expectedHash
			};

			const messageSerializer = new MessageSerializer(expectedMessage);
			const serializedMessage = messageSerializer.serialize();

			test.equal(dataString, serializedMessage);
			outgoingSocket.end();
			server.close(test.end);
		});
	});
});
