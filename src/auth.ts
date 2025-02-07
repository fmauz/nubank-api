import { CLIENT_SECRET } from "./constants";
import { Context } from "./context";
import {
  generateKeyPair,
  parseAuthenticationHeader,
  KeyPair,
  parseCertificate,
  generateSelfSignedCertificate,
  serializePublicKey,
  pkcs12ToBuffer,
} from "./utils/cert";

type RequestAuthenticationCodeInput = {
  cpf: string;
  password: string;
  deviceId: string;
};

type ExchangeCertificatesInput = RequestAuthenticationCodeInput & {
  authCode: string;
};

export class Auth {
  public _keyPair: KeyPair = generateKeyPair();
  public _keyPairCrypto: KeyPair = generateKeyPair();
  public _encryptedCode: string = "";

  public constructor(private _context: Context) {}

  private async authenticate(cpf: string, password: string): Promise<void> {
    const data = await this._context.http.request("post", "login", {
      client_id: "other.conta",
      client_secret: CLIENT_SECRET,
      grant_type: "password",
      login: cpf,
      password,
    });

    this.updateAuthState(data);
  }

  public async authenticateWithQrCode(
    cpf: string,
    password: string,
    qrCodeId: string
  ): Promise<void> {
    await this.authenticate(cpf, password);

    const data = await this._context.http.request("post", "lift", {
      qr_code_id: qrCodeId,
      type: "login-webapp",
    });

    this.updateAuthState(data);
  }

  public async authenticateWithCertificate(
    cpf: string,
    password: string,
    cert?: Buffer
  ): Promise<void> {
    if (cert) {
      this._context.http.cert = cert;
    }
    try{
      const data = await this._context.http.request("post", "token", {
        client_id: "legacy_client_id",
        client_secret: "legacy_client_secret",
        grant_type: "password",
        login: cpf,
        password,
      });
      this.updateAuthState(data);
    }catch(error: any) {
      return Promise.reject(error);
    }
  }

  public async authenticateWithRefreshToken(
    refreshToken: string
  ): Promise<void> {
    const data = await this._context.http.request("post", "token", {
      client_id: "legacy_client_id",
      client_secret: "legacy_client_secret",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    this.updateAuthState(data);
  }

  public async requestAuthenticationCode({
    cpf,
    password,
    deviceId,
  }: RequestAuthenticationCodeInput): Promise<string> {
    const { headers } = await this._context.http
      .rawRequest("post", "gen_certificate", {
        login: cpf,
        password,
        device_id: deviceId,
        model: [this._context.http.clientName, deviceId].join(" - "),
        public_key: serializePublicKey(this._keyPair.publicKey),
        public_key_crypto: serializePublicKey(this._keyPairCrypto.publicKey),
      })
      .catch(({ response }) => {
        if (response.status !== 401 || !response.headers["www-authenticate"]) {
          throw new Error("Authentication code request failed.");
        }
        return response;
      });

    const parsed = parseAuthenticationHeader(headers["www-authenticate"]);
    this._encryptedCode =
      parsed.get("device-authorization_encrypted-code") ?? "";

    return parsed.get("sent-to") ?? "";
  }

  public async exchangeCertificates({
    cpf,
    password,
    deviceId,
    authCode,
  }: ExchangeCertificatesInput): Promise<{
    cert: Buffer;
    certCrypto: Buffer;
  }> {
    if (!this._encryptedCode) {
      throw new Error(
        "No encrypted code found. Did you call `requestAuthenticationCode` before exchanging certs?"
      );
    }

    const payload = {
      login: cpf,
      password,
      device_id: deviceId,
      model: [this._context.http.clientName, deviceId].join(" - "),
      public_key: serializePublicKey(this._keyPair?.publicKey),
      public_key_crypto: serializePublicKey(this._keyPairCrypto?.publicKey),
      code: authCode,
      "encrypted-code": this._encryptedCode,
    };

    const data = await this._context.http.request(
      "post",
      "gen_certificate",
      payload
    );

    const cert = parseCertificate(data.certificate);
    const selfSignedCert = generateSelfSignedCertificate(this._keyPair, cert);

    const certCrypto = parseCertificate(data?.certificate_crypto);
    const selfSignedCertCrypto = generateSelfSignedCertificate(
      this._keyPairCrypto,
      certCrypto
    );

    return {
      cert: pkcs12ToBuffer(selfSignedCert),
      certCrypto: pkcs12ToBuffer(selfSignedCertCrypto),
    };
  }

  private updateAuthState(data: Record<string, any>): void {
    this._context.http.accessToken =
      data?.access_token ?? this._context.http.accessToken;
    this._context.http.refreshToken =
      data?.refresh_token ?? this._context.http.refreshToken;
    this._context.http.refreshBefore =
      data?.refresh_before ?? this._context.http.refreshBefore;
    this._context.http.privateUrls = {
      ...this._context.http.authState.privateUrls,
      ...data?._links,
    };
  }

  public revokeAccess(): void {
    this._context.http.clearSession();
  }
}
