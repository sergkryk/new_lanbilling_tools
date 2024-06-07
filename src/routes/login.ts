import { Router } from "express";
import { authController, loginController } from "../controllers/login";

const loginRouter = Router();

loginRouter.get("/", loginController);
loginRouter.post("/", authController);

export default loginRouter;
