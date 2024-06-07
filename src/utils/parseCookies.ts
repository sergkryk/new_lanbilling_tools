import { Request, Response, NextFunction } from "express";

type ParserResponse = {
  [key: string]: string;
}

export const parseCookies = function (request: Request) {
  const list: ParserResponse = {};
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(`;`).forEach(function (cookie) {
    let [name, ...rest] = cookie.split(`=`);
    name = name?.trim();
    if (!name) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });
  return list;
};
