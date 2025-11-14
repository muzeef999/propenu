// routes/auth.js
import express from 'express';
import User from '../models/userModel';
import { genOtp } from '../utils/genOtp';
import { saveOtpToRedis, verifyAndConsumeOtp } from '../utils/saveOtpRedis';
import { sendOtpEmail, sendWelcomeEmail } from '../utils/email';
import { generateToken } from '../utils/jwt';

const authRoute = express.Router();

authRoute.post('/request-otp', async (req, res) => {
  try { 
 
      const name = req.body.name;
      if (!name) return res.status(400).json({ message: 'name is required' });
 
      const email = req.body.email?.trim()?.toLowerCase();
      if (!email) return res.status(400).json({ message: 'Email is required' });


    const otp = genOtp();

    await saveOtpToRedis(email, otp);        
    await sendOtpEmail(email, otp, name); 
    res.status(200).json({ message: 'OTP sent successfully' });

 } catch(error) {
     res.status(500).json({ message: 'Failed to send OTP' });
}
});

authRoute.post('/verify-otp', async (req, res) => {
  try {
    const email = req.body.email?.trim()?.toLowerCase();
    const otp = req.body.otp?.trim();
     const name = req.body.name;
     
     if(!email) return res.status(400).json({ message: 'Email is required' });
     if(!otp) return res.status(400).json({ message: 'OTP is required' });
     if(!name) return res.status(400).json({ message: 'Name is required' });
 
     const isValid  =  await verifyAndConsumeOtp(email, otp);
     
     if (!isValid)    return res.status(400).json({ message: 'Invalid or expired OTP' });
    
     let createdNewUser = false;
     let user = await User.findOne({ email });


      const token = generateToken({
      sub: user ? String(user._id) : email, // fallback to email for first-time users
      email,
      name,
      role: 'user',
    });



     if (!user) {
       user = await User.create({name, email, token} as any);
       createdNewUser = true;
     }
     else {
        if (!user.name && name) user.name = name;
        (user as any).token = token;
        await user.save();
     }

     if (createdNewUser) {
  // Fire-and-forget is fine; or await if you want to ensure it’s sent
  sendWelcomeEmail(email, name).catch(err =>
    console.error("Welcome email failed:", err?.message || err)
  );
}

     return res.status(200).json({ message: 'OTP verified successfully', token, user });
 
    }catch(error) {
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

export default authRoute;
