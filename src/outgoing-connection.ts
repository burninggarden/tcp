import Net                from 'net';
import Connection         from 'connection';
import ConnectionOptions  from 'types/connection-options';
import {ConnectionStatus} from '@burninggarden/enums';


abstract class OutgoingConnection extends Connection {
	private connectionOptions: ConnectionOptions;

	public constructor(options: ConnectionOptions) {
		super();

		this.connectionOptions = options;
	}

	public connect(): void {
		const socket = Net.createConnection(
			this.getConnectionOptions(),
			this.handleConnected.bind(this)
		);

		this.setSocket(socket);
	}

	private handleConnected(): void {
		this.setStatus(ConnectionStatus.CONNECTED);
	}

	private getConnectionOptions(): ConnectionOptions {
		return this.connectionOptions;
	}
}

export default OutgoingConnection;
