import Net                from 'net';
import Message            from 'types/message';
import EventEmitter       from 'events';
import MessageParser      from 'message-parser';
import ConnectionEvent    from 'enums/connection-event';
import MessageSerializer  from 'message-serializer';
import {ConnectionStatus} from '@burninggarden/enums';
import {
	BaseError,
	InvalidMessageTypeError
} from '@burninggarden/errors';

abstract class Connection extends EventEmitter {
	protected status        : ConnectionStatus;
	private   socket        : Net.Socket | undefined;
	private   messageParser : MessageParser | undefined;

	protected abstract getAllowedMessageTypes(): string[];

	public constructor() {
		super();

		this.status = ConnectionStatus.NOT_CONNECTED;

		this.initHandlers();
	}

	public setSocket(socket: Net.Socket): this {
		this.socket = socket;

		socket.on('data',  this.handleSocketData);
		socket.on('close', this.handleSocketClosed);

		return this;
	}

	public sendMessage(message: Message): void {
		const serializedMessage = this.serializeMessage(message);

		this.getSocket().write(serializedMessage);
	}

	protected handleValidationError(error: BaseError): void {
		this.emit(ConnectionEvent.ERROR, error);
	}

	protected setStatus(status: ConnectionStatus): this {
		this.status = status;
		return this;
	}

	protected handleMessage(message: Message): void {
		this.emit(ConnectionEvent.MESSAGE, message);
	}

	protected getValidationErrorsForMessage(message: Message): BaseError[] {
		const errors: BaseError[] = [];

		if (!this.isAllowedMessageType(message.type)) {
			errors.push(this.getInvalidMessageTypeErrorForMessage(message));
		}

		return errors;
	}

	private initHandlers(): void {
		this.handleSocketData   = this.handleSocketData.bind(this);
		this.handleSocketClosed = this.handleSocketClosed.bind(this);
	}

	private handleSocketData(data: Buffer): void {
		const messages = this.getMessageParser().parse(data);

		messages.forEach(message => {
			this.validateAndHandleMessage(message);
		});
	}

	private handleSocketClosed(): void {
		this.emit(ConnectionEvent.CLOSED);
	}

	private validateAndHandleMessage(message: Message): void {
		if (this.validateMessage(message)) {
			this.handleMessage(message);
		}
	}

	private validateMessage(message: Message): boolean {
		const validationErrors = this.getValidationErrorsForMessage(message);

		validationErrors.forEach(error => {
			this.handleValidationError(error);
		});

		return validationErrors.length === 0;
	}

	private isAllowedMessageType(messageType: string): boolean {
		return this.getAllowedMessageTypes().includes(messageType);
	}

	private getInvalidMessageTypeErrorForMessage(
		message: Message
	): InvalidMessageTypeError {
		return new InvalidMessageTypeError(
			message.type,
			this.getAllowedMessageTypes()
		);
	}

	private getSocket(): Net.Socket {
		if (this.socket === undefined) {
			throw new Error('Tried to access socket, but it was not set');
		}

		return this.socket;
	}

	private getMessageParser(): MessageParser {
		if (!this.messageParser) {
			this.messageParser = new MessageParser();
		}

		return this.messageParser;
	}

	private serializeMessage(message: Message): string {
		return (new MessageSerializer(message)).serialize();
	}
}

export default Connection;
