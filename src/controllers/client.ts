import { Request, Response } from "express";
import NodeSoap from "../models/soap";
import { isNodeSoapAccountFullResponse, isNodeSoapClientLoginResponse, isNodeSoapGetServiceResponse, isNodeSoapVgroupResponse } from "../types/typeguards";

async function userLoginHandler(req: Request): Promise<number> {
  const soapClient = await NodeSoap.init();
  const { login, password } = req.body;
  const clientLogin = await soapClient.clientLogin({
    login: `user_${login}`,
    pass: password,
  });
  if (!isNodeSoapClientLoginResponse(clientLogin)) {
    throw new Error();
  }
  const uid = clientLogin[0].ret[0].uid;
  return uid;
}

async function fetchFullClientInfo(uid: number) {
  const soapClient = await NodeSoap.init();
  const accountRequest = await soapClient.getAccount({
    id: uid,
  });
  if (!isNodeSoapAccountFullResponse(accountRequest)) {
    throw new Error()
  }
  const vgroupRequest = await soapClient.getVgroups({flt: {
    userid: uid
  }})
  if (!isNodeSoapVgroupResponse(vgroupRequest)) {
    throw new Error()
  }
  const tarid = vgroupRequest[0].ret[0].tarid;
  const servicesRequest = await soapClient.getServiceCategories({flt: {
    tarid
  }});
  if (!isNodeSoapGetServiceResponse(servicesRequest)) {
    throw new Error()
  }
  const { above, rentperiod, tarname } = servicesRequest[0].ret[0];
  const userFullInfo = {
    name: accountRequest[0].ret[0].account.name,
    address: accountRequest[0].ret[0].addresses[0].address,
    phone: accountRequest[0].ret[0].account.phone,
    login: accountRequest[0].ret[0].account.login,
    pass: accountRequest[0].ret[0].account.pass,
    deposit: accountRequest[0].ret[0].agreements[0].balance,
    blocked: vgroupRequest[0].ret[0].blocked,
    tarif: {above, rentperiod, tarname}
  }
  console.log(userFullInfo);
  return userFullInfo;
}

export const clientControllerGet = async function (req: Request, res: Response) {
  res.render("login", {
    title: "Login page",
  });
}

export const clientController = async function (req: Request, res: Response) {
  try {
    const uid = await userLoginHandler(req);
    const userData = await fetchFullClientInfo(uid);
    res.json(userData);
  } catch (error) {
    console.log(error);
  }
};
