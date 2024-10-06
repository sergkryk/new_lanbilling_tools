import { Router } from "express";
import { citypayController } from "../controllers/citypay";

const psbRouter = Router();

psbRouter.get("/", citypayController);

export default psbRouter;
