import { Request } from "express";
import {
  ICitypaySmsInformer,
  NodeSoapAccountResponse,
  NodeSoapVgroupResponse,
} from "../types/types";
import {
  isCitypayQuery,
  isNodeSoapVgroupResponse,
  isNodeSoapAccountResponse,
} from "../types/typeguards";
import { sendSms } from "../utils/sms";
import NodeSoap from "../models/soap";

export default class CitypaySmsInformer implements ICitypaySmsInformer {
  public req: Request;
  public db: NodeSoap;

  constructor(req: Request, soapClient: NodeSoap) {
    this.req = req;
    this.db = soapClient;
  }
  async informViaSms(type: "pay" | "cancel"): Promise<void> {
    if (!isCitypayQuery(this.req.query)) {
      return;
    }
    // получаю данные учетной записи чтобы использовать баланс
    const vgroup: NodeSoapVgroupResponse = await this.db.getVgroups({
      flt: { login: this.req.query.Account },
    });
    // получаю данные пользователя чтобы использовать номер телефона
    const account: NodeSoapAccountResponse = await this.db.getAccounts({
      flt: { login: this.req.query.Account },
    });
    let smsBody = "";
    const balance = vgroup[0].ret[0].balance;
    const phone = account[0].ret[0].account.phone;
    if (
      isNodeSoapAccountResponse(account) &&
      isNodeSoapVgroupResponse(vgroup)
    ) {
      switch (type) {
        case "pay":
          smsBody = `На л/с №${this.req.query.Account} поступил платёж на сумму ${this.req.query.Amount} руб. Баланс ${balance} руб.`;
          break;
        case "cancel":
          smsBody = `Отмена платежа на л/с №${this.req.query.Account} на сумму ${this.req.query.Amount} руб. Баланс ${balance} руб.`;
          break;

        default:
          break;
      }
      sendSms({
        number: phone,
        message: smsBody,
      });
    }
  }
}
