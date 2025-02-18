// app/api/profileImage/route.ts
import { IncomingForm } from 'formidable';
import { NextResponse, NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import ProfileImage from '../../../../models/profileimage.model';
import fs from 'fs/promises';
import { connectDB } from '../../../../lib/dbconnect';

// app/api/profileImage/route.ts
export async function DELETE(request: NextRequest) {
    try {
      // Parse request body
      const { email, imageURL } = await request.json();
  
      // Validate required fields
      if (!email || !imageURL) {
        return NextResponse.json(
          { error: 'Both email and imageURL are required' },
          { status: 400 }
        );
      }
  
      // Connect to database
      await connectDB();
      const profile = await ProfileImage.findOne({ email });
  
      // Check if user exists
      if (!profile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
  
      // Verify the image belongs to the user
      if (profile.profileImage !== imageURL) {
        return NextResponse.json(
          { error: 'Image does not belong to this user' },
          { status: 403 }
        );
      }
  
      // Extract public ID from Cloudinary URL
      const urlParts = imageURL.split('/');
      const uploadIndex = urlParts.indexOf('upload');
  
      // Validate Cloudinary URL structure
      if (uploadIndex === -1) {
        return NextResponse.json(
          { error: 'Invalid Cloudinary URL' },
          { status: 400 }
        );
      }
  
      // Get parts after 'upload' and remove file extension
      const publicIdParts = urlParts.slice(uploadIndex + 2);
      const publicId = publicIdParts
        .join('/')
        .replace(/\.[^/.]+$/, ''); // Remove file extension
  
      // Delete from Cloudinary
      const deletionResult = await cloudinary.uploader.destroy(publicId);
      
      if (deletionResult.result !== 'ok') {
        return NextResponse.json(
          { error: 'Failed to delete image from Cloudinary' },
          { status: 500 }
        );
      }
  
      // Remove image reference from MongoDB
      profile.profileImage = null;
      await profile.save();
  
      return NextResponse.json({
        success: true,
        email,
        deletedImage: imageURL,
        message: 'Profile image successfully deleted',
      });
  
    } catch (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Image deletion failed' },
        { status: 500 }
      );
    }
  }

// // app/api/profileImage/route.ts
// import { IncomingForm } from 'formidable';
// import { NextResponse, NextRequest } from 'next/server';
// import { v2 as cloudinary } from 'cloudinary';
// import ProfileImage from '../../../models/profileimage.model';
// import fs from 'fs/promises';
// import { connectDB } from '../../../lib/dbconnect';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const config = {
//   api: { bodyParser: false },
// };

// // ... [Keep the existing parseForm and POST functions] ...

// export async function DELETE(request: NextRequest) {
//   try {
//     // Parse email from request body
//     const { email } = await request.json();
//     if (!email) {
//       return NextResponse.json(
//         { error: 'Email is required' },
//         { status: 400 }
//       );
//     }

//     // Connect to database
//     await connectDB();
//     const profile = await ProfileImage.findOne({ email });
    
//     if (!profile) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     if (!profile.profileImage) {
//       return NextResponse.json(
//         { error: 'No profile image to delete' },
//         { status: 400 }
//       );
//     }

//     // Extract public ID from Cloudinary URL
//     const urlParts = profile.profileImage.split('/');
//     const uploadIndex = urlParts.indexOf('upload');
//     const publicIdParts = urlParts.slice(uploadIndex + 2);
//     const publicId = publicIdParts
//       .join('/')
//       .replace(/\..+$/, ''); // Remove file extension

//     // Delete from Cloudinary
//     await cloudinary.uploader.destroy(publicId);

//     // Remove image reference from database
//     profile.profileImage = null;
//     await profile.save();

//     return NextResponse.json({
//       success: true,
//       email,
//       message: 'Profile image successfully deleted',
//     });
    
//   } catch (error) {
//     console.error('Delete error:', error);
//     return NextResponse.json(
//       { error: 'Image deletion failed' },
//       { status: 500 }
//     );
//   }
// }

