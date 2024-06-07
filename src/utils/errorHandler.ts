import { Response, Request } from "express";
import { xmlCodes } from "../config/citypayResponseCodes";
import { convertToXml } from "./xml";
import { httpErrorLogger } from "./log";

export const citypayErrorHandler = function (
  req: Request,
  res: Response,
  error: any
) {
  httpErrorLogger(req, error);
  let message = error instanceof Error ? error.message : xmlCodes.other;
  res.send(
    convertToXml({
      ResultCode: { _text: message },
      Comment: { _text: "" },
    })
  );
};
