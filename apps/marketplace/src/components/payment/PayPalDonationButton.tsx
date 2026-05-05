import React from 'react';

interface PayPalDonationButtonProps {
  amount?: number;
  frequency?: 'once' | 'monthly';
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
}

export default function PayPalDonationButton({ amount }: PayPalDonationButtonProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {amount && (
        <p className="text-sm text-gray-600 text-center">
          You are donating <strong>${amount}</strong> via PayPal's secure checkout.
        </p>
      )}
      <form
        action="https://www.paypal.com/donate"
        method="post"
        target="_top"
        className="flex justify-center"
      >
        <input type="hidden" name="hosted_button_id" value="V7QAHAPRBB2UW" />
        {amount && (
          <input type="hidden" name="amount" value={amount.toFixed(2)} />
        )}
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
          border="0"
          name="submit"
          title="PayPal - The safer, easier way to pay online!"
          alt="Donate with PayPal button"
          className="cursor-pointer"
        />
        <img
          alt=""
          border="0"
          src="https://www.paypal.com/en_US/i/scr/pixel.gif"
          width="1"
          height="1"
        />
      </form>
      <p className="text-xs text-gray-500 text-center">
        You will be redirected to PayPal's secure site to complete your donation.
      </p>
    </div>
  );
}
