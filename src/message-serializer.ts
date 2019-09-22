import Message      from 'types/message';
import MessageToken from 'enums/message-token';

const DELIMITER_REGEX = new RegExp(MessageToken.DELIMITER, 'g');

class MessageSerializer {
	private message: Message;

	public constructor(message: Message) {
		this.message = message;
	}

	public serialize(): string {
		const message = this.getMessage();
		const messageString = JSON.stringify(message);
		const sanitizedMessage = messageString.replace(DELIMITER_REGEX, '');

		return sanitizedMessage + MessageToken.DELIMITER;
	}

	private getMessage(): Message {
		return this.message;
	}
}

export default MessageSerializer;
