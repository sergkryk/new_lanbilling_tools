import OpenClient from "../models/openClient";
import { NodeSoapAccountResponse, PrintCheckCommand, PrintCheckResponse } from "../types/types";

function printCheckCommand (smsEmail54FZ: string, sum: number, isCashless: boolean ): PrintCheckCommand {
  return {
        goods: [{
            name: "Услуги связи",
            price: sum,
            count: 1,
            sum,
            nds_not_apply: true,
            item_type: 4,
            payment_mode: 4,
        }],
        author: "Крюков Сергей Николаевич",
        tag1055: "2",
        smsEmail54FZ,
        payed_cash: !isCashless ? sum : 0,
        payed_cashless: isCashless ? sum : 0,
        payed_credit: 0,
        payed_prepay: 0,
        payed_consideration: 0,
      };
}

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const isValidPhone = (phone: string) => /^(7|8)\d{10}$/.test(phone)

const formatPhone = (phone: string): string => isValidPhone(phone) ? phone.replace(/^(7|8)(\d{3})(\d{3})(\d{2})(\d{2})$/, "+7$2$3$4$5") : "";
const formatEmail = (email: string): string => isValidEmail(email) ? email : "";

export const registerReceipt = async function(account: NodeSoapAccountResponse, amount: number, isCashless = false): Promise<PrintCheckResponse> {
  const { phone = "", mobile = "", email = "asknet.online@gmail.com" } = account[0].ret[0].account;
  let smsEmail54FZ = formatEmail(email) || formatPhone(phone) || formatPhone(mobile);
  const onlineReceipt = new OpenClient();
  const response = await onlineReceipt.printCheck(printCheckCommand(smsEmail54FZ, amount, isCashless))
  return response;
}
