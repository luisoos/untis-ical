import express from "express";
import controller from "../controller";
const router = express.Router();

router.get("/:userId/:token", controller.request);

export default router;