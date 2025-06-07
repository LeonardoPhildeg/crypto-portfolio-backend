import express from "express";
import { getCash, addCash } from "../controllers/cashController";

const router = express.Router();

router.get("/", getCash);
router.post("/add", addCash);

export default router;
