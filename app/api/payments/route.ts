import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const paymentData = await request.json();
    
    // בשלב זה נחזיר תשובה חיובית בלי באמת לשמור בשרת
    // בעתיד כאן יהיה חיבור למסד נתונים
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error saving payment:', error);
    return NextResponse.json(
      { error: 'Failed to save payment' },
      { status: 500 }
    );
  }
} 