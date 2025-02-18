// app/api/profileImage/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
// import ProfileImage from '../../../../models/profileimage.model';
import ProfileImage from '../../../../models/profileimage.model';
import fs from 'fs/promises';
import { connectDB } from '../../../../lib/dbconnect';

// Add this interface at the top of the file
interface CloudinaryResponse {
  secure_url: string;
}

// Helper: Convert an ArrayBuffer to a base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const config = {
  api: { bodyParser: false },
};

export async function POST(request: NextRequest) {
  try {
    // Configure Cloudinary with credentials
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Parse form data using Next's built-in formData() method
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const file = formData.get('file') as File;

    // Validate inputs
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert the file (a Blob) to a base64 data URI
    const arrayBuffer = await file.arrayBuffer();
    const base64String = arrayBufferToBase64(arrayBuffer);
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload directly using cloudinary's upload method instead of REST API
    const cloudResult = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, {
        folder: 'profile-images', // Optional: organize images in a folder
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result as CloudinaryResponse);
      });
    });

    // Connect to the database and find the user's profile by email
    await connectDB();
    console.log('Searching for user with email:', email);
    const user = await ProfileImage.findOne({ email });
    console.log('User found:', user);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If a previous profile image exists, attempt to delete it from Cloudinary
    if (user.profileImage) {
      try {
        const urlParts = user.profileImage.split('/');
        const publicId = urlParts.slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting old image from Cloudinary:', error);
      }
    }

    // Update the profile in the database with the new image URL
    user.profileImage = cloudResult.secure_url;
    await user.save();

    
    return NextResponse.json({ cloudinaryUrl: cloudResult.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
