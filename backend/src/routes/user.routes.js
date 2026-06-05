import { Router } from "express"
import { authCheck, loginUser, logoutUser, refreshAccessToken, signUp } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route('/register').post(signUp);

router.route('/login').post(loginUser);

router.route('/authcheck').get(authCheck);

router.route('/refreshtoken').post(refreshAccessToken);

router.route('/logout').post(verifyJWT,logoutUser);


export default router;