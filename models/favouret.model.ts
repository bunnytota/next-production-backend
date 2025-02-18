import mongoose, { Schema, model, models } from "mongoose";

export interface IFavouret{

    _id?: mongoose.Types.ObjectId;
    cardId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;  
    //not the creater but the user who like the card
}


const favouretSchema = new Schema<IFavouret>({

    cardId:{

        type: Schema.Types.ObjectId,
        ref: 'Card'
    },

    userId:{
        type: Schema.Types.ObjectId,
        ref: 'User'

    },

},{timestamps:true})


const Favouret = models.favouret ||  model<IFavouret>("Favouret", favouretSchema)

export default Favouret;