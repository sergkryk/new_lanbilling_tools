import { Router } from "express";
import { checkController, payController } from "../controllers/dealer";
import { tokenVerification } from "../middleware/tokenVerification";

const dealerRouter = Router();
dealerRouter.use(tokenVerification);

dealerRouter.get("/", checkController);
dealerRouter.post("/", payController);

export default dealerRouter;
