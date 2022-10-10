import express from 'express';
import authController from '../controllers/auth';

const router = express.Router();

router.post('/register', authController.checkNotAuthenticated, authController.register);
router.post('/login', authController.checkNotAuthenticated, authController.login);
router.post('/logout', authController.checkAuthenticated, authController.logout);

export default router;