import { Router } from "express"
import { loginUser, signUp } from "../controllers/user.controller.js";


const router = Router();

router.route('/register').post(signUp);

router.route('/login').post(loginUser);


export default router;