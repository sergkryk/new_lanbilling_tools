import { Request, Response } from "express";
import { signToken } from "../utils/jwt";
import NodeSoap from "../models/soap";
import { isNodeSoapLoginResponseHeaders } from "../types/typeguards";
const TOKEN_LIFESPAN = 7000*1000; // время жизни токена 12 часов

export const loginController = async function (req: Request, res: Response) {
  res.render("login", {
    title: "Login page",
  });
};

export const authController = async function (req: Request, res: Response) {
  try {
    const { login, pass } = req.body;
    
    if (!login || !pass) {
      throw new Error();
    }
    const soapClient = await NodeSoap.init();
    await soapClient.loginAsync({login, pass});
    if (!isNodeSoapLoginResponseHeaders(soapClient.client.lastResponseHeaders)) {
      throw new Error("Failed to authorize!");
    }
    const billingResponseHeader = soapClient.client.lastResponseHeaders;
    const token = signToken(String(billingResponseHeader["set-cookie"]));
    res.cookie('token', token, { expires: new Date(Date.now() + TOKEN_LIFESPAN)}); 
    res.status(200).send();
  } catch (error) {
    res.status(401).send();
  }
};
