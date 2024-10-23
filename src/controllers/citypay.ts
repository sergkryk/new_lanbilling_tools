import { Request, Response, NextFunction } from "express";
import {
  NodeSoapAccountResponse,
  NodeSoapGetPaymentsResponse,
  NodeSoapPaymentResponse,
  NodeSoapVgroupResponse,
  PaymentArguments,
} from "../types/types";
import {
  isCitypayCheck,
  isCitypayQuery,
  isNodeSoapGetPaymentsResponse,
  isNodeSoapPaymentResponse,
  isNodeSoapVgroupResponse,
} from "../types/typeguards";
import { xmlCodes } from "../config/citypayResponseCodes";
import { convertToXml } from "../utils/xml";
import { providers } from "../config/providers";
import { httpQueryLogger } from "../utils/log";
import { citypayErrorHandler } from "../utils/errorHandler";
import CitypaySmsInformer from "./citipaySmsInformer";
import NodeSoap from "../models/soap";
import { registerReceipt } from "./onlineReceipts";

class CityPay {
  public request: Request;
  public response: Response;
  public next: NextFunction;
  public modperson: string = "";
  public transactionId: string = "";
  public queryType: string = "";
  public dbModel!: NodeSoap;
  constructor(req: Request, res: Response, next: NextFunction) {
    this.request = req;
    this.response = res;
    this.next = next;
  }

  _isAbleToCancel(payment: NodeSoapGetPaymentsResponse): void {
    if (
      !isNodeSoapGetPaymentsResponse(payment) ||
      payment[0].ret[0].pay.status === 2 ||
      this.modperson !== String(payment[0].ret[0].pay.modperson)
    ) {
      throw new Error(xmlCodes.not_found);
    }
  }
  _logRequest(): void {
    httpQueryLogger(this.request);
  }
  _verifyQuery(): void {
    if (
      !isCitypayCheck(this.request.query) ||
      !isCitypayQuery(this.request.query)
    ) {
      throw new Error(xmlCodes.wrong_format);
    }
  }
  async _cancelPayment(
    payment: NodeSoapGetPaymentsResponse
  ): Promise<NodeSoapPaymentResponse> {
    const cancelled = await this.dbModel.cancelPayment(payment[0].ret[0]);
    if (!isNodeSoapPaymentResponse(cancelled)) {
      throw new Error(xmlCodes.int_error);
    }
    return cancelled;
  }
  async _getVgroup(): Promise<NodeSoapVgroupResponse> {
    const { Account } = this.request.query;
    const vgroup = await this.dbModel.getVgroups({
      flt: { login: Account },
    });
    if (!isNodeSoapVgroupResponse(vgroup)) {
      throw new Error(xmlCodes.not_found);
    }
    return vgroup;
  }
  async _informClient(type: "pay" | "cancel"): Promise<void> {
    const informer = new CitypaySmsInformer(this.request, this.dbModel);
    await informer.informViaSms(type);
  }
  async _initDBClient(): Promise<void> {
    this.dbModel = await NodeSoap.init();
    await this.dbModel.managerLogin();
  }
  async _isPaymentUnique(): Promise<void> {
    const { TransactionId } = this.request.query;
    const payment = await this.dbModel.getPayments({
      flt: {
        receipt: TransactionId,
      },
    });
    if (isNodeSoapGetPaymentsResponse(payment)) {
      throw new Error(xmlCodes.not_finished);
    }
  }
  async _getPayments(): Promise<NodeSoapGetPaymentsResponse> {
    const payment = await this.dbModel.getPayments({
      flt: {
        receipt: this.transactionId,
      },
    });
    if (!isNodeSoapGetPaymentsResponse(payment)) {
      throw new Error(xmlCodes.not_found);
    }
    return payment;
  }
  async _processPayment(
    args: PaymentArguments
  ): Promise<NodeSoapPaymentResponse> {
    const paymentReq = await this.dbModel.payment(args);
    if (!isNodeSoapPaymentResponse(paymentReq)) {
      throw new Error(xmlCodes.int_error);
    }
    return paymentReq;
  }
  async requestHandler(): Promise<void> {
    // проверяю запрос на соответсвие формату
    this._verifyQuery();
    // объявляю общие переменные для всех типов запросов
    // модперсон, нужна чтобы передать в платежку оператора платежа, делаю через url т.к. для каждого оператора платежей предусмотрен отдельный url для запроса
    this.modperson = providers[this.request.baseUrl.replace("/", "")];
    // идентификатор транзакции
    this.transactionId = String(this.request.query.TransactionId);
    // тип запроса
    this.queryType = String(this.request.query.QueryType);
    // создаю инстанс модели для работы с биллингом и авторизуюсь в нём
    await this._initDBClient();
    // записываю запрос в журнал
    this._logRequest();
    // далее разделяю логику в зависимости от типа запроса
    switch (this.queryType) {
      case "check":
        await this.check();
        break;
      case "pay":
        await this.pay();
        break;
      case "cancel":
        await this.cancel();
        break;
      default:
        throw new Error(xmlCodes.wrong_format);
    }
    await this.dbModel.logoutAsync();
  }
  async check(): Promise<void> {
    // запрашиваю у биллинга информацию об учетной записи
    const vgroupRequest: NodeSoapVgroupResponse = await this._getVgroup();
    // проверяю уникальность идентификатора платежа
    await this._isPaymentUnique();
    // отправляю ответ согласно форме
    this.response.send(
      convertToXml({
        TransactionId: { _text: this.transactionId },
        ResultCode: { _text: xmlCodes.ok },
        Fields: {
          field1: {
            _attributes: {
              name: "name",
            },
            _text: vgroupRequest[0].ret[0].username,
          },
        },
      })
    );
  }
  async pay(): Promise<void> {
    // определяю необходимые переменные
    const { Amount } = this.request.query;
    // получаю данные о учётной записи
    const vgroupRequest: NodeSoapVgroupResponse = await this._getVgroup();
    const agrmid = String(vgroupRequest[0].ret[0].agrmid);
    //регистрирую онлайн чек
    const account: NodeSoapAccountResponse = await this.dbModel.getAccounts({
      flt: {
        agrmid,
      },
    });
    const { command_id, receipt_url } = await registerReceipt(
      account,
      Number(Amount),
      true
    );
    // собираю аргументы платежа в один объект
    const paymentParams: PaymentArguments = {
      agrmid,
      amount: String(Amount),
      modperson: this.modperson,
      transactionId: this.transactionId,
      comment: receipt_url || "",
      uuid: command_id || -1,
    };
    // отправляю запрос для проведения платежа
    const paymentReq = await this._processPayment(paymentParams);
    // отправляю подтверждение проведенного платежа
    this.response.send(
      convertToXml({
        TransactionId: { _text: this.transactionId },
        TransactionExt: { _text: paymentReq[0].ret },
        Amount: { _text: Amount },
        ResultCode: { _text: xmlCodes.ok },
        Comment: { _text: "" },
      })
    );
    // информирую через смс об оплате
    await this._informClient("pay");
  }
  async cancel(): Promise<void> {
    const payment = await this._getPayments();
    // проверяю платеж на соответствие типу, статусу (2 означает отмененный), совпадению провайдера проводившего и отменяющего платеж
    this._isAbleToCancel(payment);
    // делаю запрос на отмену платежа
    const cancelled = await this._cancelPayment(payment);
    // отправляю подтверждение отмененного платежа
    this.response.send(
      convertToXml({
        TransactionId: { _text: this.transactionId },
        TransactionExt: { _text: cancelled[0].ret },
        Amount: { _text: this.request.query.Amount },
        ResultCode: { _text: xmlCodes.ok },
        Comment: { _text: "" },
      })
    );
    // информирую через смс об отмене оплаты
    await this._informClient("cancel");
  }
}

export const citypayController = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const citypay = new CityPay(req, res, next);
    await citypay.requestHandler();
  } catch (error: any) {
    citypayErrorHandler(req, res, error);
  }
};
