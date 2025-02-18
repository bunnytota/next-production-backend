import mongoose, { Schema, model, models } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export const VIDEO_DIMENSION ={
    width: 1080,
    height: 1920,
}

export interface ICard {
  _id?: mongoose.Types.ObjectId;  
  image: string;
  storelink: string;
  productlink: string;
  watsapplink: string;
  title: string;
  description: string;
  Instagramlink: string;
  shortvideolink: string;
  videocontrols?: boolean;
  videotransformation?:{
    width: number;
    height: number;
    quality: number;
  }
  gmaillink: string;
  owner: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAT?: Date;
  //followers,
  //likes,
  //storename ,
  //profileImage,
}

const cardSchema = new Schema(
  {
    image: {
      type: String,
      required: true,
    },
    title:{
        type: String,
      required: true,
    },

    storelink: {
      type: String,
      required: true,
    },
    productlink: {
      type: String,
      required: true,
    },
    watsapplink: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    Instagramlink: {
      type: String,
      required: true,
    },
    shortvideolink: {
      type: String,
      required: true,
    },
    videocontrols:{
          type: Boolean,
          required: true,

    },
    videotransformation:{
         height:{type:Number ,default:VIDEO_DIMENSION.height},
         width:{ type:Number ,default:VIDEO_DIMENSION.width},
         quality:{type:Number ,min:1, max:100 }
    },


    gmaillink: {
      type: String,
      required: true,
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

  },
  { timestamps: true }
);

cardSchema.plugin(mongooseAggregatePaginate)

const Card = models.card || model<ICard>("Card", cardSchema);

export default Card;
