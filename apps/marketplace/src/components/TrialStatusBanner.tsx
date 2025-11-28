import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, CheckCircle, XCircle, Users, CreditCard } from 'lucide-react';
import { toast } from './ui/use-toast';

interface TrialStatus {
  in_trial: boolean;
  trial_started_at: string;
  trial_ends_at: string;
  trial_active: boolean;
  choice_made: boolean;
  is_member: boolean;
  days_remaining: number;
  hours_remaining: number;
}

interface MembershipChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoice: (isMember: boolean) => void;
}

const MembershipChoiceModal: React.FC<MembershipChoiceModalProps> = ({
  isOpen,
  onClose,
  onChoice
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Choose Your Membership Path</h2>
        <p className="text-gray-600 mb-6">
          Your 7-day free trial is ending. Choose how you'd like to continue using the platform:
        </p>

        <div className="space-y-4">
          {/* Member Option */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Join Organization (Free)</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Get free access to all features, custom email, and Google Workspace setup.
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Free lifetime access</li>
                  <li>• Custom @constructivedesigns.com email</li>
                  <li>• Optional 10% donation to support platform</li>
                  <li>• Full member benefits</li>
                </ul>
              </div>
            </div>
            <Button
              onClick={() => onChoice(true)}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
            >
              Join Organization
            </Button>
          </div>

          {/* Non-Member Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-6 h-6 text-gray-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Continue as Non-Member</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Pay $25/month for continued access. Cancel anytime.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• $25/month subscription</li>
                  <li>• Full platform access</li>
                  <li>• Cancel anytime</li>
                  <li>• No long-term commitment</li>
                </ul>
              </div>
            </div>
            <Button
              onClick={() => onChoice(false)}
              variant="outline"
              className="w-full mt-3"
            >
              Start $25/Month Subscription
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            You can change your mind later, but this choice affects your pricing and features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function TrialStatusBanner() {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [processingChoice, setProcessingChoice] = useState(false);

  useEffect(() => {
    if (user) {
      loadTrialStatus();
    }
  }, [user]);

  const loadTrialStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_trial_status', { p_user_id: user.id });

      if (error) throw error;
      setTrialStatus(data);

      // Auto-show choice modal if trial is ending soon and no choice made
      if (data.in_trial && !data.choice_made && data.hours_remaining <= 24) {
        setShowChoiceModal(true);
      }
    } catch (error) {
      console.error('Error loading trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMembershipChoice = async (isMember: boolean) => {
    if (!user) return;

    setProcessingChoice(true);
    try {
      const { data, error } = await supabase
        .rpc('process_membership_choice', {
          p_user_id: user.id,
          p_chose_membership: isMember
        });

      if (error) throw error;

      toast({
        title: 'Choice Saved',
        description: data.message,
      });

      setShowChoiceModal(false);
      await loadTrialStatus(); // Refresh status

      // Redirect based on choice
      if (isMember && data.next_step === 'google_workspace_setup') {
        // Redirect to Google Workspace setup
        window.location.href = '/google-workspace-setup';
      } else if (!isMember && data.next_step === 'subscription_setup') {
        // Redirect to subscription setup
        window.location.href = '/subscription-setup';
      }
    } catch (error) {
      console.error('Error processing choice:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your choice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingChoice(false);
    }
  };

  if (loading || !trialStatus) {
    return null; // Don't show anything while loading
  }

  // Don't show banner if choice already made
  if (trialStatus.choice_made) {
    return null;
  }

  // Don't show banner if trial ended and defaulted to non-member
  if (!trialStatus.trial_active && !trialStatus.choice_made) {
    return null;
  }

  const getStatusColor = () => {
    if (trialStatus.days_remaining <= 1) return 'bg-red-100 border-red-500 text-red-800';
    if (trialStatus.days_remaining <= 3) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-blue-100 border-blue-500 text-blue-800';
  };

  const getStatusIcon = () => {
    if (!trialStatus.in_trial) return <XCircle className="w-5 h-5" />;
    if (trialStatus.days_remaining <= 1) return <Clock className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <>
      <Card className={`mb-6 border-l-4 ${getStatusColor()}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-semibold">
                  {trialStatus.in_trial ? 'Free Trial Active' : 'Trial Expired'}
                </h3>
                <p className="text-sm">
                  {trialStatus.in_trial
                    ? `${trialStatus.days_remaining} days remaining`
                    : 'Please choose your membership path'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {trialStatus.in_trial && (
                <Badge variant="outline">
                  {trialStatus.hours_remaining}h left
                </Badge>
              )}
              <Button
                onClick={() => setShowChoiceModal(true)}
                size="sm"
                className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
              >
                Choose Path
              </Button>
            </div>
          </div>

          {trialStatus.in_trial && trialStatus.days_remaining <= 3 && (
            <div className="mt-3 p-3 bg-white bg-opacity-50 rounded">
              <p className="text-sm">
                Your trial ends on {new Date(trialStatus.trial_ends_at).toLocaleDateString()}.
                Choose your membership path before then to avoid interruption.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <MembershipChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onChoice={handleMembershipChoice}
      />
    </>
  );
}