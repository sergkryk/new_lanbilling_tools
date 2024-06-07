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

main();
