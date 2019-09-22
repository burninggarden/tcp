import Net               from 'net';
import Message           from 'types/message';
import Connection        from 'connection';
import {BaseError}       from '@burninggarden/errors';
import MessageType       from 'enums/message-type';
import MessageParser     from 'message-parser';


abstract class IncomingConnection extends Connection {
	protected handleValidationError(error: BaseError): void {
		this.sendValidationError(error);

		return super.handleValidationError(error);
	}

	private sendValidationError(error: BaseError): void {
		const message = this.convertErrorToMessage(error);

		this.sendMessage(message);
	}

	private convertErrorToMessage(error: BaseError): Message {
		return {
			type:  MessageType.ERROR,
			error: error.toHash()
		};
	}
}

export default IncomingConnection;
