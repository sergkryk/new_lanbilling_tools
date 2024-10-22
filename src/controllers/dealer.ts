import { Request, Response } from "express";
import CitypaySmsInformer from "./citipaySmsInformer";
import { httpQueryLogger } from "../utils/log";
import {
  isNodeSoapPaymentResponse,
  isNodeSoapVgroupResponse,
  isPayFormBody,
  isToken,
} from "../types/typeguards";
import NodeSoap from "../models/soap";

// Function to modify request object for Citypay query
const getCitypayQueryObj = (req: Request, sum: string): Request => {
  const citypayKeys = {
    QueryType: "pay",
    TransactionId: "",
    TransactionDate: "",
    Account: String(req.query.account),
    Amount: sum,
  };
  Object.assign(req.query, citypayKeys);
  return req;
};
// GET Controller
export const checkController = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {

    const lanbillingToken = req.body.token;
    if (!isToken(lanbillingToken)) {
      res.redirect("login");
    }

    const account = req.query?.account;
    if (!account || typeof account !== "string") {
      throw new Error();
    }

    const soapClient = await NodeSoap.init();
    soapClient.addAuthorisationHttpHeader([lanbillingToken["set-cookie"]]);

    const vgroupRequest = await soapClient.getVgroups({
      flt: { login: account },
    });
    if (!isNodeSoapVgroupResponse(vgroupRequest)) {
      throw new Error();
    }

    const { username, login, tarifdescr, balance, address, agrmid } =
      vgroupRequest[0].ret[0];
    res.render("pay", {
      title: "Account",
      agrmid: agrmid,
      uid: login.replace("user_", ""),
      fio: username,
      street: address[0].address,
      balance: balance,
      tariff: tarifdescr,
    });
  } catch (error) {
    res.render("check", { title: "Initial State", notFound: false });
    return;
  }
};

// POST controller
export const payController = async function (req: Request, res: Response) {
  try {
    // Validate request body
    if (!isPayFormBody(req.body)) {
      throw new Error();
    }
    // Extract required fields from request body
    const { agrmid, sum, token } = req.body;
    // Initialize database model
    const soapClient = await NodeSoap.init();
    soapClient.addAuthorisationHttpHeader([token["set-cookie"]])
    // Modify request object to add necessary fields for SMS notification
    const updatedReq = getCitypayQueryObj(req, sum);
    // Create an instance of CitypaySmsInformer
    const informer = new CitypaySmsInformer(updatedReq, soapClient);
    // Send payment to the billing
    const payment = await soapClient.payment({
      agrmid,
      amount: sum,
    });
    // // Check if payment response is valid
    if (!isNodeSoapPaymentResponse(payment)) {
      throw new Error();
    }
    // // Get payment ID
    const payid = payment[0].ret;
    // // Log transaction in queries.txt file
    updatedReq.query.TransactionId = String(payid);
    httpQueryLogger(req);
    // // Send SMS notification to the user
    await informer.informViaSms("pay");
    // // Render success page with payment details
    res.render("success", {
      sum,
      payid: payid,
    });
  } catch (error) {
    // Render fail page
    res.render("fail", {});
  }
};
