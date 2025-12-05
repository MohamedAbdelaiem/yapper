import { getToken } from '@/src/utils/secureStorage';
import { io, Socket } from 'socket.io-client';

// TODO: Move these to environment variables/config
const SOCKET_URL = 'https://yapper.cmp27.space';
const SOCKET_PATH = '/socket-local.io';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, SocketCallback[]> = new Map();

  public async connect(): Promise<Socket | null> {
    const token = await getToken();

    if (!token) {
      console.warn('SocketService: No token found, cannot connect.');
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    // Disconnect existing socket if any (e.g. reconnecting with new token)
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(`${SOCKET_URL}/messages`, {
      path: SOCKET_PATH,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token,
      },
      query: {
        auth: token,
      },
    });

    this.socket.connect();

    this.setupListeners();

    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public emit(event: string, data: unknown) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('SocketService: Socket not connected, cannot emit', event);
    }
  }

  public on(event: string, callback: SocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback: SocketCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // Connection established
    });

    this.socket.on('disconnect', () => {
      // Disconnected
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection Error', error);
    });

    // Re-attach listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }
}

export const socketService = new SocketService();
