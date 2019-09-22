import Message        from 'types/message';
import MessageToken   from 'enums/message-token';
import {FileEncoding} from '@burninggarden/enums';

class MessageParser {
	private remainder: string;

	public constructor() {
		this.remainder = '';
	}

	public parse(data: Buffer): Message[] {
		const remainder = this.getRemainder();
		const dataString = remainder + data.toString(FileEncoding.UTF8);
		const parts = dataString.split(MessageToken.DELIMITER);

		this.setRemainder(parts.pop());

		return parts.map(this.parseRawMessage);
	}

	private parseRawMessage(rawMessage: string): Message {
		return JSON.parse(rawMessage);
	}

	private getRemainder(): string {
		return this.remainder;
	}

	private setRemainder(remainder: string): void {
		this.remainder = remainder;
	}
}

export default MessageParser;
