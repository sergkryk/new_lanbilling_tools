import { Router } from "express";
import { paydayController } from "../controllers/payday";

const paydayRouter = Router();

paydayRouter.get("/", paydayController);

export default paydayRouter;
