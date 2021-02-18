import { Manager, Socket } from "socket.io-client";
import { URL } from "url";
import { CredentialStore } from "./CredentialStore";

export class SocketFactory {
  private readonly manager: Manager;

  constructor(private readonly baseUrl: string, private readonly creds: CredentialStore) {
    const url = new URL(baseUrl);
    url.protocol = "ws";
    this.manager = new Manager(url, {});
  }

  get(namespace: string): Socket {
    return this.manager.socket(namespace, {
      auth: { token: this.creds.authorization },
    });
  }
}
