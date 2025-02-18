// middleware.ts
import { NextResponse,NextRequest } from 'next/server';

//proflie image uploading middleware
export function middleware(request:NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/profile/profileimage'], // Adjust routes if needed
};
