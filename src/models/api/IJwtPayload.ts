export interface IJwtPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  claims: string[];
  email?: string;
  publicKey?: string;
}
