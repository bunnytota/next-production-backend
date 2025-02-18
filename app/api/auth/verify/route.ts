// /app/api/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import Otp from "../../../../models/otp.model";
import User from "../../../../models/user.model";
import { connectDB } from "../../../../lib/dbconnect";
import bcrypt from "bcryptjs";
import { rateLimit } from "../../../../lib/rateLimit";
import logger from "../../../../lib/logger";

// Joi schema for OTP verification.
const verifySchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting.
    try {
      await rateLimit(request);
    } catch (error) {
      logger.warn("Rate limit exceeded for OTP verification");
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    
    const payload = await request.json();
    const { error, value } = verifySchema.validate(payload);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }
    const { email, otp } = value;
    
    await connectDB();

    // Retrieve OTP record.
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Validate OTP.
    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid || otpRecord.expiresAt < new Date()) {
      logger.warn(`Invalid or expired OTP attempt for ${email}`);
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Mark the user as verified.
    await User.updateOne({ email }, { verified: true });
    await Otp.deleteOne({ email });

    logger.info(`User ${email} verified successfully`);

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error("Verification error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
