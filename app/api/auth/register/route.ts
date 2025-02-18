// /app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import User from "../../../../models/user.model";
import Otp from "../../../../models/otp.model";
import { connectDB } from "../../../../lib/dbconnect";
import bcrypt from "bcryptjs";
import transporter from "../../../../lib/nodemailer";
import { rateLimit } from "../../../../lib/rateLimit";
import logger from "../../../../lib/logger";

const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Joi schema for input validation.
const registrationSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  verified: Joi.boolean() // Add this line to allow the verified field
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting.
    try {
      await rateLimit(request);
    } catch (error) {
      logger.warn("Rate limit exceeded for registration");
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    
    const payload = await request.json();
    const { error, value } = registrationSchema.validate(payload);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }
    const { name, email, password } = value;
    
    await connectDB();

    // Check for duplicate username or email.
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Create new user with verified set to false.
    await User.create({ name, email, password, verified: false });

    // Generate OTP, hash it, and set its expiry (5 minutes).
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpHash, expiresAt });
     console.log("otp:",otp);
    // Send OTP via email.
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Email Verification OTP",
      html: `<p>Hello ${name},</p>
             <p>Your OTP for email verification is: <strong>${otp}</strong></p>
             <p>This OTP is valid for 5 minutes.</p>`,
    });

    logger.info(`New user registered; OTP sent to ${email}`);

    return NextResponse.json(
      { message: "User registered. Please verify your email." },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("Registration error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
