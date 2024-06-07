import { Router } from "express";
import { citypay } from "../controllers/citypay";

const postofficeRouter = Router();

postofficeRouter.get("/", citypay);

export default postofficeRouter;
