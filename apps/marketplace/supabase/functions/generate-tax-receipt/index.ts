import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NONPROFIT_INFO = {
  name: 'Constructive Designs Inc.',
  ein: 'XX-XXXXXXX', // Replace with your actual EIN
  address: '123 Main Street',
  city: 'Your City',
  state: 'YS',
  zip: '12345',
  phone: '(555) 123-4567',
  email: 'donations@constructivedesignsinc.org',
  website: 'https://constructivedesignsinc.org',
  taxExemptStatus: '501(c)(3) Public Charity',
};

interface TaxReceiptData {
  receiptNumber: string;
  recipientName: string;
  recipientEmail: string;
  donationAmount: number;
  donationDate: string;
  orderId: string;
  description: string;
  recipientType: 'seller' | 'buyer';
}

const generateReceiptHTML = (data: TaxReceiptData): string => {
  const currentYear = new Date().getFullYear();
  const recipientTypeLabel = data.recipientType === 'seller' ? 'Seller' : 'Buyer';
  const donationPurpose = data.recipientType === 'seller' 
    ? 'Optional seller support donation collected from buyer'
    : 'Platform support donation';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
    .nonprofit-info { font-size: 12px; color: #666; line-height: 1.6; }
    .receipt-title { font-size: 24px; font-weight: bold; margin: 30px 0 20px; }
    .receipt-number { color: #666; font-size: 14px; margin-bottom: 30px; }
    .section { margin: 25px 0; }
    .section-title { font-weight: bold; color: #2563eb; margin-bottom: 10px; font-size: 14px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { color: #666; }
    .detail-value { font-weight: 600; }
    .amount-highlight { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .amount-highlight .amount { font-size: 28px; font-weight: bold; color: #2563eb; }
    .tax-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; }
    .tax-notice-title { font-weight: bold; color: #92400e; margin-bottom: 8px; }
    .tax-notice-text { font-size: 13px; color: #78350f; line-height: 1.5; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
    .signature-section { margin: 40px 0; }
    .signature-line { border-top: 2px solid #000; width: 300px; margin-top: 60px; }
    .signature-label { font-size: 12px; color: #666; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏗️ ${NONPROFIT_INFO.name}</div>
    <div class="nonprofit-info">
      ${NONPROFIT_INFO.address}<br>
      ${NONPROFIT_INFO.city}, ${NONPROFIT_INFO.state} ${NONPROFIT_INFO.zip}<br>
      EIN: ${NONPROFIT_INFO.ein} | ${NONPROFIT_INFO.taxExemptStatus}<br>
      ${NONPROFIT_INFO.phone} | ${NONPROFIT_INFO.email}
    </div>
  </div>

  <div class="receipt-title">Tax-Deductible Donation Receipt</div>
  <div class="receipt-number">Receipt #: ${data.receiptNumber}</div>

  <div class="section">
    <div class="section-title">${recipientTypeLabel} Information</div>
    <div class="detail-row">
      <span class="detail-label">Name:</span>
      <span class="detail-value">${data.recipientName}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Email:</span>
      <span class="detail-value">${data.recipientEmail}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Donation Details</div>
    <div class="detail-row">
      <span class="detail-label">Date of Donation:</span>
      <span class="detail-value">${new Date(data.donationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Transaction ID:</span>
      <span class="detail-value">${data.orderId}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Purpose:</span>
      <span class="detail-value">${donationPurpose}</span>
    </div>
  </div>

  <div class="amount-highlight">
    <div style="text-align: center;">
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">Total Tax-Deductible Donation</div>
      <div class="amount">$${data.donationAmount.toFixed(2)}</div>
    </div>
  </div>

  <div class="tax-notice">
    <div class="tax-notice-title">⚠️ Important Tax Information</div>
    <div class="tax-notice-text">
      <strong>No goods or services were provided in exchange for this donation.</strong><br><br>
      This receipt acknowledges your tax-deductible donation to ${NONPROFIT_INFO.name}, a ${NONPROFIT_INFO.taxExemptStatus} 
      organization as described in Section 501(c)(3) of the Internal Revenue Code. Our EIN is ${NONPROFIT_INFO.ein}.<br><br>
      <strong>Please retain this receipt for your tax records.</strong> Your donation is tax-deductible to the fullest 
      extent allowed by law. Consult your tax advisor for specific guidance on deductibility.
    </div>
  </div>

  <div class="signature-section">
    <div>Thank you for your generous support!</div>
    <div class="signature-line"></div>
    <div class="signature-label">Authorized Representative, ${NONPROFIT_INFO.name}</div>
    <div class="signature-label">Date: ${new Date().toLocaleDateString('en-US')}</div>
  </div>

  <div class="footer">
    This is an official tax receipt for your donation to ${NONPROFIT_INFO.name}.<br>
    Receipt generated on ${new Date().toLocaleString('en-US')}<br>
    Questions? Contact us at ${NONPROFIT_INFO.email} or visit ${NONPROFIT_INFO.website}
  </div>
</body>
</html>
  `;
};

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderFeeId, receiptType } = await req.json() as { orderFeeId: string; receiptType: 'seller' | 'buyer' | 'both' };

    // Get order fee details from v2 table
    const { data: orderFee, error: feeError } = await supabase
      .from('order_fees_v2')
      .select(`
        *,
        seller:profiles!seller_id(full_name, workspace_email),
        buyer:profiles!buyer_id(full_name, workspace_email)
      `)
      .eq('id', orderFeeId)
      .single();

    if (feeError || !orderFee) {
      throw new Error('Order fee not found');
    }

    const results: { seller?: any; buyer?: any } = {};

    // Generate Seller Receipt if requested
    if ((receiptType === 'seller' || receiptType === 'both') && orderFee.seller_donation_amount > 0) {
      if (orderFee.seller_tax_receipt_issued) {
        results.seller = {
          success: true,
          message: 'Seller receipt already issued',
          receiptNumber: orderFee.seller_tax_receipt_number
        };
      } else {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const sellerReceiptNumber = `STR-${year}-${random}`;

        const sellerReceiptData: TaxReceiptData = {
          receiptNumber: sellerReceiptNumber,
          recipientName: orderFee.seller.full_name || 'Seller',
          recipientEmail: orderFee.seller.workspace_email,
          donationAmount: parseFloat(orderFee.seller_donation_amount),
          donationDate: orderFee.created_at,
          orderId: orderFee.order_id,
          description: 'Seller support donation collected from buyer',
          recipientType: 'seller',
        };

        const sellerReceiptHTML = generateReceiptHTML(sellerReceiptData);

        const { error: updateError } = await supabase
          .from('order_fees_v2')
          .update({
            seller_tax_receipt_issued: true,
            seller_tax_receipt_number: sellerReceiptNumber,
            seller_tax_receipt_issued_at: new Date().toISOString(),
          })
          .eq('id', orderFeeId);

        if (updateError) throw new Error('Failed to update seller receipt status');

        results.seller = {
          success: true,
          receiptNumber: sellerReceiptNumber,
          receiptHTML: sellerReceiptHTML,
          message: 'Seller tax receipt generated and sent to ' + sellerReceiptData.recipientEmail,
        };
      }
    }

    // Generate Buyer Receipt if requested
    if ((receiptType === 'buyer' || receiptType === 'both') && orderFee.buyer_donation_amount > 0) {
      if (orderFee.buyer_tax_receipt_issued) {
        results.buyer = {
          success: true,
          message: 'Buyer receipt already issued',
          receiptNumber: orderFee.buyer_tax_receipt_number
        };
      } else {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const buyerReceiptNumber = `BTR-${year}-${random}`;

        const buyerReceiptData: TaxReceiptData = {
          receiptNumber: buyerReceiptNumber,
          recipientName: orderFee.buyer.full_name || 'Buyer',
          recipientEmail: orderFee.buyer.workspace_email,
          donationAmount: parseFloat(orderFee.buyer_donation_amount),
          donationDate: orderFee.created_at,
          orderId: orderFee.order_id,
          description: 'Platform support donation',
          recipientType: 'buyer',
        };

        const buyerReceiptHTML = generateReceiptHTML(buyerReceiptData);

        const { error: updateError } = await supabase
          .from('order_fees_v2')
          .update({
            buyer_tax_receipt_issued: true,
            buyer_tax_receipt_number: buyerReceiptNumber,
            buyer_tax_receipt_issued_at: new Date().toISOString(),
          })
          .eq('id', orderFeeId);

        if (updateError) throw new Error('Failed to update buyer receipt status');

        results.buyer = {
          success: true,
          receiptNumber: buyerReceiptNumber,
          receiptHTML: buyerReceiptHTML,
          message: 'Buyer tax receipt generated and sent to ' + buyerReceiptData.recipientEmail,
        };
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating tax receipt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
