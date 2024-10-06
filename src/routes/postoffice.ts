import { Router } from "express";
import { citypayController } from "../controllers/citypay";

const postofficeRouter = Router();

postofficeRouter.get("/", citypayController);

export default postofficeRouter;
