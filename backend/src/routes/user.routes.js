import { Router } from "express"
import { authCheck, changePassword, googleAuth, loginUser, logoutUser, refreshAccessToken, registerDevice, resetPass, sendOTP, signUp, verifyOTP } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route('/register').post(signUp);

router.route('/login').post(loginUser);

router.route('/authcheck').get(authCheck);

router.route('/refreshtoken').post(refreshAccessToken);

router.route('/logout').post(verifyJWT,logoutUser);

router.route('/registerDevice').post(verifyJWT,registerDevice);

router.route('/changePassword').post(verifyJWT,changePassword);

router.route('/sendOtp').post(sendOTP);

router.route('/verifyOtp').post(verifyOTP);

router.route('/resetpass').post(resetPass);

router.route('/googleAuth').post(googleAuth);

export default router;