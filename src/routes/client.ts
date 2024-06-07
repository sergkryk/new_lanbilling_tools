import { Router } from "express";
import { clientController, clientControllerGet } from "../controllers/client";

const clientRouter = Router();

clientRouter.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    next()
})

clientRouter.get("/", clientControllerGet);
clientRouter.post("/", clientController);

export default clientRouter;
