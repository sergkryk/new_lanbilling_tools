import { parseCookies } from "../utils/parseCookies";

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt"

export const tokenVerification = function (req: Request, res: Response, next: NextFunction) {
  try {
    const cookies = parseCookies(req);
    if (cookies?.token) {
      const verified = verifyToken(cookies.token);
      req.body.token = verified;
      next();
    } else {
      throw new Error();
    }
  } catch (error) {
    if (req.method === "POST") {
      res.render("fail", {message: "Время сессии истекло. Авторизуйтесь повторно."});
    } else {
      res.redirect("login");
    }
  }
};
