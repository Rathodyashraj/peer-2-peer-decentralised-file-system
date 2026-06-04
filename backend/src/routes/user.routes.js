import { Router } from "express"
import { authCheck, loginUser, refreshAccessToken, signUp } from "../controllers/user.controller.js";


const router = Router();

router.route('/register').post(signUp);

router.route('/login').post(loginUser);

router.route('/authcheck').get(authCheck);

router.route('/refreshtoken').post(refreshAccessToken);


export default router;