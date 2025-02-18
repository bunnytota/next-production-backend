// /app/api/resend-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import Otp from "../../../../models/otp.model";
import User from "../../../../models/user.model";
import { connectDB } from "../../../../lib/dbconnect";
import transporter from "../../../../lib/nodemailer";
import bcrypt from "bcryptjs";
import { rateLimit } from "../../../../lib/rateLimit";
import logger from "../../../../lib/logger";

// Joi schema for resending OTP.
const resendSchema = Joi.object({
  email: Joi.string().email().required(),
});

const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting.
    try {
      await rateLimit(request);
    } catch (error) {
      logger.warn("Rate limit exceeded for OTP resend");
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    
    const payload = await request.json();
    const { error, value } = resendSchema.validate(payload);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }
    const { email } = value;
    
    await connectDB();

    // Check that the user exists and is not already verified.
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    if (user.verified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new OTP and update the record.
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    console.log("resend-otp:",otp);
    await Otp.findOneAndUpdate(
      { email },
      { otp: otpHash, expiresAt },
      { upsert: true, new: true }
    );

    // Send the new OTP via email.
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Resend: Email Verification OTP",
      html: `<p>Your new OTP for email verification is: <strong>${otp}</strong></p>
             <p>This OTP is valid for 5 minutes.</p>`,
    });

    logger.info(`Resent OTP to ${email}`);

    return NextResponse.json(
      { message: "New OTP sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error("Resend OTP error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
