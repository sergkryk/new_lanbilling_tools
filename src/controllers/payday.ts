import { Request, Response, NextFunction } from "express";
import {
  isNodeSoapGetPaymentsPaydayResponse,
  isPaydayQuery,
} from "../types/typeguards";
import { GetPaymentsProfile } from "../types/types";
import { convertToXml } from "../utils/xml";
import { citypayErrorHandler } from "../utils/errorHandler";
import NodeSoap from "../models/soap";

const MODPERSON = 10;
const PAYMENT_STATUS_COMPLETED = 0;

const today = new Date();
const MIN_DATE = new Date(2024, 0, 1);
const MAX_DATE = new Date(today.setDate(today.getDate() + 1));

function parseDateString(dateString: string): Date {
  // Extract year, month, day, hour, minute, and second from the string
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // Month is zero-based in Date object (0 - 11)
  const day = parseInt(dateString.substring(6, 8));
  return new Date(year, month, day);
}

export const paydayController = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validate query parameters
    if (!isPaydayQuery(req.query)) {
      throw new Error("3");
    }

    const { CheckDateBegin, CheckDateEnd } = req.query;
    const dateBegin = parseDateString(String(CheckDateBegin));
    const dateEnd = parseDateString(String(CheckDateEnd));

    // Ensure dates fall within bounds
    if (dateEnd <= dateBegin || dateBegin < MIN_DATE || dateEnd > MAX_DATE) {
      throw new Error("299");
    }

    // Ensure max dates interval
    const maxDatesInterval = new Date(dateEnd);
    maxDatesInterval.setMonth(maxDatesInterval.getMonth() - 1);
    if (maxDatesInterval >= dateBegin) {
      throw new Error("299");
    }

    // Initialize database model
    const soapClient = await NodeSoap.init();
    await soapClient.managerLogin();

    // Get payments from database
    const result = await soapClient.getPayments({
      flt: {
        dtfrom: String(CheckDateBegin),
        dtto: String(CheckDateEnd),
      },
    });

    // Check if result has 'ret' property
    if (isNodeSoapGetPaymentsPaydayResponse(result)) {
      const payments = result[0].ret;

      // Filter payments based on conditions
      const filteredPayments = payments.filter(
        (el: GetPaymentsProfile): boolean => {
          return (
            el.pay.modperson === MODPERSON &&
            el.pay.status === PAYMENT_STATUS_COMPLETED
          );
        }
      );

      // Map payments to XML format
      const paymentsXml = filteredPayments.map((el: GetPaymentsProfile): {} => {
        const TransactionId = el.pay.receipt;
        const TransactionDate = el.pay.paydate.replace(/\D/g, "");
        const Account = el.login.replace("user_", "");
        const Amount = el.pay.amount;

        return {
          Payment: {
            TransactionId: { _text: TransactionId },
            Account: { _text: Account },
            TransactionDate: { _text: TransactionDate },
            Amount: { _text: Amount },
          },
        };
      });
      await soapClient.logoutAsync();
      // Set response content type and send XML response
      res.set("Content-Type", "text/xml");
      res.send(convertToXml(paymentsXml));
    } else {
      // Handle case when result doesn't have 'ret' property
      throw new Error("21");
    }
  } catch (error) {
    citypayErrorHandler(req, res, error);
  }
};
