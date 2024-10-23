import { URLSearchParams } from "url";

import crypto from "crypto";
import { PrintCheckResponse } from "../types/types";

interface ICommand {
  [key: string]: any;
}

type OpenClientRequest = {
  nonce: string;
  [keys: string]: any;
};

export default class OpenClient {
  private accountUrl: string;
  private appID: string;
  private secret: string;
  private headers: Headers;

  constructor() {
    this.accountUrl = String(process.env.OPENCLIENT_URL);
    this.appID = String(process.env.OPENCLIENT_APP_ID);
    this.secret = String(process.env.OPENCLIENT_SECRET);
    this.headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  }

  /* Generates a signature for the given command by sorting its parameters alphabetically,converting it to a JSON string, and hashing it with a secret using MD5. 
  @param {ICommand} command - The command object to sign. @returns {string} Generated signature in hexadecimal format.*/
  private _getSign(command: ICommand): string {
    // Сортировка параметров в алфавитном порядке
    const sortedCommandKeys = Object.keys(command).sort();
    const sortedCommand: ICommand = {};
    sortedCommandKeys.forEach((key) => {
      sortedCommand[key] = command[key];
    });
    // Преобразование в JSON строку
    const commandString = JSON.stringify(sortedCommand);
    // Вычисление подписи
    const sign = crypto
      .createHash("md5")
      .update(commandString + this.secret)
      .digest("hex");
    return sign;
  }
  //Generates a random string (nonce) of the specified length using alphanumeric characters. @param {number} length - Length of the nonce (default is 16). @returns {string} Randomly generated nonce.
  private _getNonce(length: number = 16): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let nonce = "";
    for (let i = 0; i < length; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }
  private async _get(model: string, options: {}): Promise<Response> {
    const url = `${this.accountUrl}${model}?${new URLSearchParams(options)}`;
    const request = new Request(url, {
      method: "GET",
      headers: this.headers,
    });
    const response = await fetch(request);
    return response;
  }
  private async _post(options: {}): Promise<Response> {
    const url = `${this.accountUrl}Command`;
    const request = new Request(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(options),
    });
    const response = await fetch(request);
    return response;
  }
  private async _sendRequest(
    method: string,
    model: string,
    options: OpenClientRequest
  ): Promise<PrintCheckResponse> {
    let result = new Response();
    this.headers.append("sign", this._getSign(options));
    switch (method) {
      case "GET":
        result = await this._get(model, options);
        break;
      case "POST":
        result = await this._post(options);
        break;
    }
    const data = await result.json();
    return data;
  }
  public async getStateSystem(): Promise<void> {
    await this._sendRequest("GET", "StateSystem", {
      app_id: this.appID,
      nonce: this._getNonce(),
    });
  }
  public async printCheck(command: {}): Promise<PrintCheckResponse> {
    const params = {
      type: "printCheck",
      app_id: this.appID,
      nonce: this._getNonce(),
      command,
    };
    const res = await this._sendRequest("POST", "Command", params);
    return res;
  }
  // private async _throwStatusCode(): Promise<void> {}
  //   public async openShift(): Promise<void> {}
  //   public async closeShift(): Promise<void> {}
  //   public async printPurchaseReturn(): Promise<void> {}
  //   public async dataCommandID(): Promise<void> {}
}
