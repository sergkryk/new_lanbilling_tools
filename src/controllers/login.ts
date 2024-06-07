import { Request, Response } from "express";
import { signToken } from "../utils/jwt";
import NodeSoap from "../models/soap";
import { isNodeSoapLoginResponse } from "../types/typeguards";

export const loginController = async function (req: Request, res: Response) {
  // если уже есть токен авторизации нужно сделать редирект на страницу оплаты
  res.render("login", {
    title: "Login page",
  });
};

export const authController = async function (req: Request, res: Response) {
  const TOKEN_LIFESPAN = 12*60*60*1000; // время жизни токена 12 часов
  try {
    const { login, pass } = req.body;
    
    if (!login || !pass) {
      throw new Error();
    }
    const soapClient = await NodeSoap.init();
    const managerRequest = await soapClient.loginAsync({login, pass});
    if (!isNodeSoapLoginResponse(managerRequest)) {
      throw new Error();
    }
    const aid = managerRequest[0].ret[0].manager.personid;
    const token = signToken(String(aid));
    res.cookie('token', token, { expires: new Date(Date.now() + TOKEN_LIFESPAN)}); 
    res.status(200).send();
    await soapClient.logoutAsync()
  } catch (error) {
    res.status(401).send();
  }
};
