import { Request, Response, NextFunction } from "express";
import {
  NodeSoapGetPaymentsResponse,
  NodeSoapVgroupResponse,
  PaymentArguments,
} from "../types/types";
import {
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

export const citypay = async function (req: Request, res: Response, next: NextFunction) {
  /* объявляю переменную модперсон, нужна чтобы передать в платежку оператора платежа, делаю через url 
  т.к. для каждого оператора платежей предусмотрен отдельный url для запроса */
  const provider: string = req.baseUrl.replace("/", "");
  let modperson: string = providers[provider];
  try {
    // проверяю корректность запроса и если он неправильный сообщаю об ошибке
    if (!isCitypayQuery(req.query)) {
      throw new Error(xmlCodes.wrong_format);
    }
    // объявляю переменные полученные в запросе
    const { Account, Amount, TransactionId } = req.query;
    // объявляю переменную с типом запроса
    const type = req.query.QueryType;
    // записываю в журнал запросов
    httpQueryLogger(req);
    // авторизуюсь в биллинге
    const soapClient = await NodeSoap.init();
    // запрашиваю у биллинга информацию об учетной записи
    const vgroupRequest: NodeSoapVgroupResponse = await soapClient.getVgroups({
      flt: { login: Account },
    });
    // если не получаю информацию сообщаю об ошибке
    if (!isNodeSoapVgroupResponse(vgroupRequest)) {
      throw new Error(xmlCodes.not_found);
    }
    // запрашиваю у биллинга информацию об платежке
    const payment: NodeSoapGetPaymentsResponse | {} =
      await soapClient.getPayments({
        flt: {
          receipt: TransactionId,
        },
      });
    // если запрос не на отмену платежа и биллинг находит платеж с таким же адишником - сообщаем об ошибке
    if (type !== "cancel" && isNodeSoapGetPaymentsResponse(payment)) {
      throw new Error(xmlCodes.not_finished);
    }
    // создаю инстанс логгера
    const informer = new CitypaySmsInformer(req, soapClient);
    // в зависимости от типа запросы выполняю операции согласно типу
    switch (type) {
      // тип запроса check - по факту проверки уже сделаны выше и просто отвечаем, что всё нормально
      case "check":
        res.send(
          convertToXml({
            TransactionId: { _text: req.query.TransactionId },
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
        break;
      case "pay":
        // собираю аргументы платежа в один объект
        const paymentParams: PaymentArguments = {
          agrmid: String(vgroupRequest[0].ret[0].agrmid),
          amount: Amount,
          modperson,
          transactionId: TransactionId,
        };
        // отправляю запрос для проведения платежа
        const paymentReq = await soapClient.payment(paymentParams);
        // если ответ пришел некорректный сообщаю об ошибке
        if (!isNodeSoapPaymentResponse(paymentReq)) {
          throw new Error(xmlCodes.int_error);
        }
        // отправляю подтверждение проведенного платежа
        res.send(
          convertToXml({
            TransactionId: { _text: TransactionId },
            TransactionExt: { _text: paymentReq[0].ret },
            Amount: { _text: Amount },
            ResultCode: { _text: xmlCodes.ok },
            Comment: { _text: "" },
          })
        );
        // информирую через смс об оплате
        await informer.informViaSms("pay");
        break;
      case "cancel":
        // проверяю платеж на соответствие типу, статусу (2 означает отмененный), совпадению провайдера проводившего и отменяющего платеж
        if (
          !isNodeSoapGetPaymentsResponse(payment) ||
          payment[0].ret[0].pay.status === 2 ||
          modperson !== String(payment[0].ret[0].pay.modperson)
        ) {
          throw new Error(xmlCodes.not_found);
        }
        // делаю запрос на отмену платежа
        const cancelled = await soapClient.cancelPayment(payment[0].ret[0]);
        // проверяю ответ и сообщаю об ошибке если он не верный
        if (!isNodeSoapPaymentResponse(cancelled)) {
          throw new Error(xmlCodes.int_error);
        }
        // отправляю подтверждение отмененного платежа
        res.send(
          convertToXml({
            TransactionId: { _text: TransactionId },
            TransactionExt: { _text: cancelled[0].ret },
            Amount: { _text: Amount },
            ResultCode: { _text: xmlCodes.ok },
            Comment: { _text: "" },
          })
        );
        // информирую через смс об отмене оплаты
        await informer.informViaSms("cancel");
      default:
        break;
    }
  } catch (error: any) {
    citypayErrorHandler(req, res, error);
  }
};
