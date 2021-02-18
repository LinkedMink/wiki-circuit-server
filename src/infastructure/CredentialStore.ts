import { HandshakeClient } from "@linkedmink/passport-mutual-key-challenge-client";
import EventEmitter from "events";
import { Algorithm, verify } from "jsonwebtoken";
import { URL } from "url";
import { IBearerToken } from "../models/api/IBearerToken";
import { IJwtPayload } from "../models/api/IJwtPayload";
import { config } from "./Config";
import { ConfigKey } from "./ConfigKey";
import { Logger } from "./Logger";

const RETRY_INTERVAL_MS = 2 * 60 * 1000;
const REFRESH_BEFORE_EXPIRE_MS = 30 * 60 * 1000;

export enum CredentialStoreEvent {
  Refreshed = "refreshed",
}

export class CredentialStore extends EventEmitter {
  private readonly logger = Logger.get(CredentialStore.name);
  private readonly client = new HandshakeClient();
  private jwtString = "";
  private jwtObject = {} as IJwtPayload;
  private timeout?: NodeJS.Timeout;

  get authorization(): string {
    return `Bearer ${this.jwtString}`;
  }

  get userInfo(): IJwtPayload {
    return this.jwtObject;
  }

  refresh(isAutoRefreshed = true): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    return this.callMutualAuthEndpoint()
      .then(() => {
        if (isAutoRefreshed) {
          const expireMs = this.jwtObject.exp * 1000 - Date.now() - REFRESH_BEFORE_EXPIRE_MS;
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          this.timeout = setTimeout(this.refresh.bind(this), expireMs);
        }
        this.emit(CredentialStoreEvent.Refreshed, this.jwtString, this.jwtObject);
      })
      .catch((e: unknown) => {
        this.logger.error({ message: e });
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timeout = setTimeout(this.refresh.bind(this), RETRY_INTERVAL_MS);
      });
  }

  private async callMutualAuthEndpoint() {
    const serviceId = config.getString(ConfigKey.ServiceUsername);
    const userServiceKey = config.getFileBuffer(ConfigKey.JwtPublicKeyFile);
    const requestUrl = new URL(config.getString(ConfigKey.UserServiceUrl));
    const jwtOptions = {
      algorithms: [config.getString(ConfigKey.JwtSigningAlgorithm) as Algorithm],
      audience: config.getString(ConfigKey.JwtAudience),
      issuer: config.getString(ConfigKey.JwtIssuer),
      subject: serviceId,
    };

    const tokenData = await this.client.request(
      {
        host: requestUrl.host,
        port: requestUrl.port ? Number(requestUrl.port) : undefined,
        path: "/authenticate",
        isSslRequest: requestUrl.protocol.toLowerCase() === "https",
      },
      serviceId,
      config.getFileBuffer(ConfigKey.ServiceKeyFile),
      userServiceKey
    );

    const tokenResult = JSON.parse(tokenData.toString()) as IBearerToken;
    this.jwtObject = verify(tokenResult.token, userServiceKey, jwtOptions) as IJwtPayload;
    this.jwtString = tokenResult.token;
  }
}
