// /models/profileImage.model.ts

// /models/profileImage.model.ts
import mongoose, { Schema, model, models } from "mongoose";



export interface IProfileImage {
 
  email?:mongoose.Types.ObjectId;
  // email?: string;
  _id?: mongoose.Types.ObjectId;
  profileImage?: string;
  
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

const profileImageSchema = new Schema<IProfileImage>(
  {

    email: { type: Schema.Types.ObjectId, ref:"User" },
    profileImage: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook to hash password if modified.


const ProfileImage = models.ProfileImage || model<IProfileImage>("ProfileImage", profileImageSchema);
export default ProfileImage;
