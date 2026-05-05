import { Router } from "express";
import {
  createEmailAccount,
  getAllEmailAccounts,
  updateEmailAccount,
  deleteEmailAccount,
} from "../controllers/emailAccount.controller.js";
import { verifyToken } from "../middleware/user.middleware.js";

const router = Router();

router.use(verifyToken);

router.route("/").get(getAllEmailAccounts).post(createEmailAccount);
router.route("/:id").patch(updateEmailAccount).delete(deleteEmailAccount);

export default router;
