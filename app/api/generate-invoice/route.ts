import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { booking, invoiceDetails } = await request.json();
    
    // בצירת טקסט פשוט במקום PDF
    const invoiceText = `
חשבונית מס
==========
${invoiceDetails.businessName}
ע.מ/ח.פ: ${invoiceDetails.businessId}
${invoiceDetails.businessAddress}

מספר חשבונית: ${invoiceDetails.invoiceNumber}
תאריך: ${new Date().toLocaleDateString('he-IL')}

פרטי לקוח:
שם: ${booking.guestName}

פרטי ההזמנה:
מספר הזמנה: ${booking.bookingNumber}
תאריכי שהייה: ${new Date(booking.startDate).toLocaleDateString('he-IL')} - ${new Date(booking.endDate).toLocaleDateString('he-IL')}
מספר חדר: ${booking.roomNumber}

סה"כ לתשלום: ₪${booking.price}
אמצעי תשלום: ${booking.paymentMethod}
    `.trim();

    // החזרת הטקסט כקובץ
    return new NextResponse(invoiceText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename=invoice-${booking.bookingNumber}.txt`,
      },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
} 