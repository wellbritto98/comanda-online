type SSEClient = {
  id: string;
  send: (chunk: string) => void;
};

class SSEManager {
  private channels = new Map<string, Set<SSEClient>>();

  subscribe(channel: string, client: SSEClient) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(client);
  }

  unsubscribe(channel: string, clientId: string) {
    const ch = this.channels.get(channel);
    if (!ch) return;
    for (const client of ch) {
      if (client.id === clientId) {
        ch.delete(client);
        break;
      }
    }
    if (ch.size === 0) this.channels.delete(channel);
  }

  publish(channel: string, event: string, data: object) {
    const ch = this.channels.get(channel);
    if (!ch) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of ch) {
      try {
        client.send(payload);
      } catch {
        /* client disconnected */
      }
    }
  }
}

const globalForSSE = globalThis as typeof globalThis & {
  __comandaSseManager?: SSEManager;
};

export const sseManager =
  globalForSSE.__comandaSseManager ?? new SSEManager();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.__comandaSseManager = sseManager;
}
