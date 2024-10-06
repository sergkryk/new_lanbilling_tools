import { Router } from "express";
import { clientController, clientControllerGet } from "../controllers/client";
import { corsResolver } from "../middleware/headers";

const clientRouter = Router();

clientRouter.use(corsResolver)

clientRouter.get("/", clientControllerGet);
clientRouter.post("/", clientController);

export default clientRouter;
