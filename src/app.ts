import express from "express";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
// загружаю переменные из файла .env
dotenv.config();
// импортирую роутеры из модулей
import postOfficeRouter from "./routes/postoffice";
import dealerRouter from "./routes/dealer";
import loginRouter from "./routes/login";
import psbRouter from "./routes/psb";
import paydayRouter from "./routes/payday";
import clientRouter from "./routes/client";
import OpenClient from "./models/openClient";
// переменные для порта и адреса для expressjs
const PORT = 3002;
const INTERFACE = "127.0.0.1";
// создаю веб-сервер >>>>>>>>>>>>>>
const app = express();
// подключаю миддлеваре >>>>>>>>>>>>>>
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
// Описываю маршруты >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.use("/login", loginRouter);
app.use("/client", clientRouter);
app.use("/psb", psbRouter);
app.use("/paydayreport", paydayRouter);
app.use("/postoffice", postOfficeRouter);
app.use("/dealer", dealerRouter);
// app.use("/", (req, res, next) => {
//   res.sendFile(path.join(__dirname, "views", "404.html"));
// });
async function main() {
  // запуск http сервер >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  app.listen(PORT, INTERFACE, () => {
    console.log(`The server started on ${INTERFACE} port ${PORT}`);
  });
}

// main();

const onlineCheck = new OpenClient()

onlineCheck.getStateSystem();
// onlineCheck.printCheck({
//       author: "Крюков Сергей Николаевич",
//       smsEmail54FZ: "sergkryk@ya.ru",
//       // c_num: "1111222333",
//       payed_cashless: 500,
//       goods: [
//         {
//           count: 1,
//           price: 500,
//           sum: 500,
//           name: "Пополнение лицевого счёта абонента №1110",
//           // nds_value: 20,
//           nds_not_apply: true,
//           payment_mode: 1,
//           item_type: 1,
//         },
//       ],
//     },);
// function generateNonce(length = 16) {
//   const chars =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   let nonce = "";
//   for (let i = 0; i < length; i++) {
//     nonce += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   console.log("nonce: ", nonce);
//   return nonce;
// }

// const crypto = require("crypto");

// interface IParams {
//   [key: string]: string;
// }

// const printCheckOptions = {
//   app_id: APP_ID,
//   command: "",
//   nonce: "",
//   type: "printCheck",
// };

// function getParamsStringAndSign(APP_ID: string, SECRET: string, payload = {}) {
//   const nonce = generateNonce();
//   const params: IParams = {
//     nonce,
//     app_id: APP_ID,
//     ...payload,
//   };
//   // Сортировка параметров в алфавитном порядке
//   const sortedKeys = Object.keys(params).sort();
//   const sortedParams: IParams = {};
//   sortedKeys.forEach((key) => {
//     sortedParams[key] = params[key];
//   });
//   // Преобразование в JSON строку
//   const paramsString = JSON.stringify(sortedParams);
//   // const paramsString = JSON.stringify("");
//   // // URL-кодирование JSON строки
//   // const urlEncodedParamsString = encodeURIComponent(paramsString);
//   // Вычисление подписи
//   const sign = crypto
//     .createHash("md5")
//     .update(paramsString + SECRET)
//     .digest("hex");
//   console.log("sign: ", sign);
//   console.log("paramsString: ", paramsString);
//   return {
//     paramsString,
//     sign,
//   };
// }

// getParamsStringAndSign(APP_ID, SECRET, {
//   type: "printCheck",
//   command: {
//     author: "Тестовый кассир",
//     smsEmail54FZ: "test@test.ru",
//     c_num: "1111222333",
//     payed_cashless: 1000,
//     goods: [
//       {
//         count: 2,
//         price: 500,
//         sum: 1000,
//         name: "Товар 1",
//         nds_value: 20,
//         nds_not_apply: false,
//         payment_mode: 1,
//         item_type: 1,
//       },
//     ],
//   },
// });

// console.log( new URL("https://check.business.ru/open-api/v1/"+"Account"));
