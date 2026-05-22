import { Router } from "express"
import { signUp } from "../controllers/user.controller.js";


const router = Router();

router.route('/register').post(signUp);


export default router;