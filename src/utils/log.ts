import fs from "fs";
import { isCitypayCheck, isCitypayQuery } from "../types/typeguards";
import { Request } from "express";

const QUERIES_FILE = "queries.txt";
const ERRORS_FILE = "errors.txt";

const logger = function (filename: string, message: string) {
  const writeStream = fs.createWriteStream(filename, { flags: "a" });
  writeStream.write(`Дата: ${new Date().toLocaleString("ru")} - ${message}`);
  writeStream.end();
};

export const httpQueryLogger = function (req: Request) {
  const message = JSON.stringify(req.query)+"\n";
  logger(QUERIES_FILE, message);
};

export const httpErrorLogger = function (req: Request, error: any) {
  const message =
    isCitypayQuery(req.query) && error instanceof Error
      ? `Код ошибки: ${error.message}. Тип запроса: ${req.query.QueryType}. Учетная запись: ${req.query.Account}. Сумма: ${req.query.Amount}. Идентификатор запроса: ${req.query.TransactionId}.\n`
      : `Неверный формат запроса ${JSON.stringify(
          req.query
        )}. Ошибка с текстом: ${JSON.stringify(error)}\n`;
  logger(ERRORS_FILE, message);
};
