import { Client, createClientAsync } from "soap";
import path from "path";
import { GetPaymentsProfile, PaymentArguments } from "../types/types";
import { uuidGenerator } from "../utils/uuidGenerator";
import { xmlCodes } from "../config/citypayResponseCodes";
import { isNodeSoapLoginResponseHeaders } from "../types/typeguards";

export default class NodeSoap {
  public client: Client;
  constructor(client: Client) {
    this.client = client;
  }
  static async init(): Promise<NodeSoap> {
    try {
      const client: Client = await createClientAsync(
        path.join(path.dirname(__dirname), "api3.wsdl"),
        { endpoint: process.env.BILLING_URL }
      );
      return new NodeSoap(client);
    } catch (error) {
      throw new Error(xmlCodes.int_error);
    }
  }
  async managerLogin() {
    await this.client.LoginAsync({
      login: process.env.BILLING_LOGIN,
      pass: process.env.BILLING_PASS,
    });
    if (!isNodeSoapLoginResponseHeaders(this.client.lastResponseHeaders)) {
      throw new Error("Failed to login");
    }
    this.addAuthorisationHttpHeader(this.client.lastResponseHeaders["set-cookie"])
  }
  addAuthorisationHttpHeader(sessnum: string[]) {
    this.client.addHttpHeader("set-cookie", sessnum);
  }
  async getServiceCategories(fltParams: {}) {
    const response = await this.client.getServiceCategoriesAsync(
      fltParams
    );
    return response;
  }
  async getVgroups(fltParams: {}) {
    const response = await this.client.getVgroupsAsync(fltParams);
    return response;
  }
  async getAccounts(fltParams: {}) {
    const response = await this.client.getAccountsAsync(
      fltParams
      );
      return response;
      }
  async getAccount(fltParams: {}) {
    const response = await this.client.getAccountAsync(fltParams);
    return response;
  }
  async getPayments(fltParams: {}) {
    const response = await this.client.getPaymentsAsync(
      fltParams
    );
    return response;
  }
  async payment(params: PaymentArguments) {
    const { agrmid, amount, modperson = "", comment = "", transactionId } = params;
    const receipt = transactionId || `${agrmid}-${uuidGenerator()}`;
    const response = await this.client.PaymentAsync(
      {
        val: {
          agrmid,
          amount,
          receipt,
          modperson,
          comment,
        },
      }
    );
    return response;
  }
  async cancelPayment(payload: GetPaymentsProfile) {
    const STATUS_CANCELLED = "2";
    const ZERO_AMOUNT = "0.0";
    const { recordid, agrmid, currid, classid, modperson, receipt } =
      payload.pay;
    const response = await this.client.PaymentAsync(
      {
        val: {
          recordid,
          currid,
          classid,
          modperson,
          agrmid,
          receipt,
          status: STATUS_CANCELLED,
          amount: ZERO_AMOUNT,
        },
      }
    );
    return response;
  }
  async clientLogin(fltParams: {}) {
    const response = await this.client.ClientLoginAsync(
      fltParams
    );
    return response;
  }
  async loginAsync(fltParams: {}) {
    const response = await this.client.LoginAsync(fltParams);
    return response;
  }
  async logoutAsync() {
    const response = await this.client.LogoutAsync({});
    return response;
  }
}
