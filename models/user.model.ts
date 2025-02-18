// /models/user.model.ts

// /models/user.model.ts
import mongoose, { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";


export interface IUser {
  name: string;
  email: string;
  password: string;
  profileImage?: string;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  //   edit profile
//   //watsapp
//   //instagram
//   // storelink: string;
//   //   watsapplink: string;
//   //   Instagramlink:string;
//   //   gmaillink:string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, unique: true,index: true,trim: true },
    email: { type: String, required: true, unique: true,trim: true },
    password: { type: String, required: true },
    profileImage: { type: String },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save hook to hash password if modified.
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});


//compare the password if to login user by matching 

userSchema.methods.isPasswordCorrect = async function (password:string) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.getAccessToken = function () {
  const options: SignOptions = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRY) || '15m' };
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    options
  )
}

userSchema.methods.getRefreshToken = function () {
  const options: SignOptions = { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRY) || '30d' };
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET!,
    options
  )
}


const User = models.User || model<IUser>("User", userSchema);
export default User;
