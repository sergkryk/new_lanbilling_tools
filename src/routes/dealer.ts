import { Router } from "express";
import { checkController, payController } from "../controllers/dealer";
import { tokenVerification } from "../middleware/tokenVerification";
import { corsResolver } from "../middleware/headers";

const dealerRouter = Router();
dealerRouter.use(corsResolver);
dealerRouter.use(tokenVerification);

dealerRouter.get("/", checkController);
dealerRouter.post("/", payController);

export default dealerRouter;
