import { Router } from "express";
import { citypay } from "../controllers/citypay";

const psbRouter = Router();

psbRouter.get("/", citypay);

export default psbRouter;
