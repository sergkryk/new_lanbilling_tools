import { SMSoptions } from "../types/types";

const SMSru = require("sms_ru");

function callback () {}

const sms = new SMSru(process.env.SMS_API_ID);

export const sendSms = function (options: SMSoptions) {
  const { number, message, isTest = true } = options;
  if (number.match(/^(7959|7949)\d{7}$/)) {
    sms.sms_send(
      {
        to: number,
        text: message,
        test: isTest,
      },
      callback
    );
  }
}
