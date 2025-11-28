import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Copy, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface InvitationDetails {
  affiliate_id: string;
  invitation_link: string;
  recruiting_member_id: string;
  recruiting_member_username: string;
  expires_at: string;
  instructions: string;
}

export default function RecruitAffiliateButton() {
  const { user, userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Form state
  const [affiliateEmail, setAffiliateEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    if (!user || !userProfile) {
      setError('You must be logged in to recruit affiliates');
      return;
    }

    if (!affiliateEmail.trim()) {
      setError('Please enter the affiliate\'s email address');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call create_affiliate_invitation function
      const { data, error: inviteError } = await supabase
        .rpc('create_affiliate_invitation', {
          p_recruiting_member_id: user.uid,
          p_affiliate_email: affiliateEmail.trim(),
          p_notes: notes.trim() || null
        });

      if (inviteError) throw inviteError;

      if (data) {
        setInvitation(data);
      }

    } catch (err: any) {
      console.error('Invitation generation error:', err);
      setError(err.message || 'Failed to generate invitation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (invitation) {
      navigator.clipboard.writeText(invitation.invitation_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendEmail = () => {
    if (!invitation) return;

    const subject = `Join Constructive Designs Affiliate Program`;
    const body = `Hi there,

I wanted to share an opportunity with you. I'm part of Constructive Designs, a contractor network, and I thought you might be interested in our affiliate program.

When you get leads you can't take, you can submit them to us and earn 5% commission when we complete them. Takes about 30 seconds per lead.

Here's your invitation link to sign up:
${invitation.invitation_link}

Let me know if you have any questions!

— ${userProfile?.firstName || 'A fellow contractor'}`;

    window.location.href = `mailto:${affiliateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const resetForm = () => {
    setAffiliateEmail('');
    setNotes('');
    setInvitation(null);
    setError(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Recruit Affiliate
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Recruit an Affiliate Partner</DialogTitle>
          <DialogDescription>
            Invite contractors to join as affiliates. You'll earn 2% override commission on all their referrals forever.
          </DialogDescription>
        </DialogHeader>

        {!invitation ? (
          // Step 1: Generate invitation
          <div className="space-y-4 py-4">
            
            {/* Info Box */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-sm mb-2">💰 Why Recruit Affiliates?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Earn <strong>2% override commission</strong> on every referral they submit (forever)</li>
                <li>• If they send 10 jobs/month × $3,500 avg = <strong>$700/month passive income</strong> for you</li>
                <li>• Recruit 5 affiliates = <strong>$3,500/month extra income</strong></li>
                <li>• More affiliates = more opportunities for all members</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="affiliateEmail">Affiliate's Email *</Label>
                <Input
                  id="affiliateEmail"
                  type="email"
                  placeholder="nick@thompsonconstruction.com"
                  value={affiliateEmail}
                  onChange={(e) => setAffiliateEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be included in the invitation link tracking
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="How you know them, why they'd be a good fit, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating || !affiliateEmail.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Invitation...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Generate Invitation Link
                </>
              )}
            </Button>
          </div>
        ) : (
          // Step 2: Display invitation link
          <div className="space-y-4 py-4">
            
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Invitation Link Generated!</p>
                <p className="text-xs text-green-700 mt-1">
                  Send this link to {affiliateEmail}. When they sign up, you'll start earning 2% override commission.
                </p>
              </div>
            </div>

            {/* Invitation Details */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div>
                <Label className="text-xs text-gray-600">Affiliate ID</Label>
                <p className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 mt-1">
                  {invitation.affiliate_id}
                </p>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Invitation Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={invitation.invitation_link}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <p>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm mb-2">📧 How to Send</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Option 1:</strong> Copy the link above and text/email it to them</p>
                <p><strong>Option 2:</strong> Click the button below to open a pre-written email</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSendEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Email Template
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1"
              >
                Recruit Another
              </Button>
            </div>

            {/* Commission Example */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-sm mb-3">💰 Your Earnings Potential</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>If they submit 5 leads/month:</span>
                  <span className="font-semibold text-green-600">~$350/month</span>
                </div>
                <div className="flex justify-between">
                  <span>If they submit 10 leads/month:</span>
                  <span className="font-semibold text-green-600">~$700/month</span>
                </div>
                <div className="flex justify-between">
                  <span>If they submit 20 leads/month:</span>
                  <span className="font-semibold text-green-600">~$1,400/month</span>
                </div>
                <div className="border-t border-purple-300 pt-2 mt-2">
                  <p className="text-xs text-gray-600">
                    Based on avg $3,500 per job × 50% completion rate × 2% override
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
