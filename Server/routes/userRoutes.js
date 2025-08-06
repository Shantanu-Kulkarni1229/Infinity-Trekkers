import express from "express";
import { getActiveTreks , getTrekByIdForUser} from "../controller/userController.js";

const router = express.Router();

router.get("/treks", getActiveTreks);
router.get("/treks/:id", getTrekByIdForUser);

export default router;
