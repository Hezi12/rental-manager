import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const bookingData = await request.json();
    
    // בשלב זה נחזיר תשובה חיובית בלי באמת לשמור בשרת
    // בעתיד כאן יהיה חיבור למסד נתונים
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error saving booking:', error);
    return NextResponse.json(
      { error: 'Failed to save booking' },
      { status: 500 }
    );
  }
} 