import { Client, createClientAsync } from "soap";
import path from "path";
import { GetPaymentsProfile, PaymentArguments } from "../types/types";
import { uuidGenerator } from "../utils/uuidGenerator";
import { xmlCodes } from "../config/citypayResponseCodes";

export default class NodeSoap {
  public options: {};
  public client: Client;
  constructor(client: Client, options: {}) {
    this.client = client;
    this.options = options;
  }
  static async init(): Promise<NodeSoap> {
    try {
      const options = { forever: true };
      const client: Client = await createClientAsync(
        path.join(path.dirname(__dirname), "api3.wsdl"),
        { endpoint: process.env.BILLING_URL }
      );
      await client.LoginAsync(
        { login: process.env.BILLING_LOGIN, pass: process.env.BILLING_PASS },
        options
      );
      return new NodeSoap(client, options);
    } catch (error) {
      throw new Error(xmlCodes.int_error);
    }
  }
  async getServiceCategories(fltParams: {}) {
    const response = await this.client.getServiceCategoriesAsync(fltParams, this.options);
    return response;
  }
  async getVgroups(fltParams: {}) {
    const response = await this.client.getVgroupsAsync(fltParams, this.options);
    return response;
  }
  async getAccounts(fltParams: {}) {
    const response = await this.client.getAccountsAsync(
      fltParams,
      this.options
    );
    return response;
  }
  async getAccount(fltParams: {}) {
    const response = await this.client.getAccountAsync(
      fltParams,
      this.options
    );
    return response;
  }
  async getPayments(fltParams: {}) {
    const response = await this.client.getPaymentsAsync(
      fltParams,
      this.options
    );
    return response;
  }
  async payment(params: PaymentArguments) {
    const { agrmid, amount, modperson, comment = "", transactionId } = params;
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
      },
      this.options
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
      },
      this.options
    );
    return response;
  }
  async clientLogin(fltParams: {}) {
    const response = await this.client.ClientLoginAsync(fltParams, this.options);
    return response;
  }
  async loginAsync(fltParams: {}) {
    const response = await this.client.LoginAsync(fltParams, this.options);
    return response;
  }
  async logoutAsync() {
    const response = await this.client.LogoutAsync({});
    return response;
  }
}
