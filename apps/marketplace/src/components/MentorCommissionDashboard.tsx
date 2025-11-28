import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Copy, Users, DollarSign, TrendingUp, Mail, Share2 } from 'lucide-react';
import { toast } from './ui/use-toast';

interface MentorStats {
  total_recruits: number;
  active_recruits: number;
  total_earnings: number;
  pending_commissions: number;
  monthly_earnings: number;
  recruits: Array<{
    recruit_name: string;
    recruit_type: string;
    status: string;
    earnings_generated: number;
    joined_at: string;
  }>;
}

interface InvitationData {
  affiliate_id: string;
  invitation_link: string;
  mentor_username: string;
  recruit_type: string;
  expires_at: string;
  instructions: string;
}

export default function MentorCommissionDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recruitEmail, setRecruitEmail] = useState('');
  const [recruitType, setRecruitType] = useState<'seller' | 'buyer'>('seller');
  const [recruitNotes, setRecruitNotes] = useState('');
  const [inviting, setInviting] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<InvitationData | null>(null);

  useEffect(() => {
    loadMentorStats();
  }, [user]);

  const loadMentorStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_mentor_dashboard_stats', { p_mentor_id: user.id });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading mentor stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mentor statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createRecruitmentInvitation = async () => {
    if (!recruitEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase
        .rpc('create_mentor_recruitment_invitation', {
          p_mentor_id: user!.id,
          p_recruit_email: recruitEmail,
          p_recruit_type: recruitType,
          p_notes: recruitNotes || null
        });

      if (error) throw error;

      setCurrentInvitation(data);
      toast({
        title: 'Invitation Created',
        description: 'Recruitment invitation link generated successfully',
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create recruitment invitation',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Link copied to clipboard',
    });
  };

  const shareViaEmail = () => {
    if (!currentInvitation) return;

    const subject = `Join Constructive Designs Marketplace - Earn Money Together`;
    const body = `Hi there!

I'm excited to invite you to join the Constructive Designs Marketplace. As a ${currentInvitation.recruit_type}, you'll have access to a vibrant community of buyers and sellers.

When you sign up using this link, I'll earn a small commission from your success, and you'll get full access to the platform.

Sign up here: ${currentInvitation.invitation_link}

${currentInvitation.instructions}

Best regards,
${currentInvitation.mentor_username}`;

    window.open(`mailto:${recruitEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentor Commission Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Recruit sellers and buyers, earn 2% commission from their revenue forever
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <DollarSign className="w-4 h-4 mr-2" />
          ${stats?.total_earnings?.toFixed(2) || '0.00'} Earned
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recruits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_recruits || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_recruits || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.total_earnings?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.pending_commissions?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.monthly_earnings?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Current month earnings
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recruit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recruit">Recruit Affiliates</TabsTrigger>
          <TabsTrigger value="recruits">My Recruits</TabsTrigger>
        </TabsList>

        <TabsContent value="recruit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recruit New Affiliates</CardTitle>
              <CardDescription>
                Invite sellers and buyers to join the marketplace. You'll earn 2% commission from their revenue forever.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="notes">Personal Note (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add a personal message to make your invitation more compelling..."
                  value={recruitNotes}
                  onChange={(e) => setRecruitNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={createRecruitmentInvitation}
                disabled={inviting}
                className="w-full"
              >
                {inviting ? 'Creating Invitation...' : 'Create Recruitment Invitation'}
              </Button>
            </CardContent>
          </Card>

          {currentInvitation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Recruitment Invitation Created
                </CardTitle>
                <CardDescription>
                  Share this link with {recruitEmail}. When they sign up, you'll start earning commissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Invitation Link:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white rounded text-sm">
                      {currentInvitation.invitation_link}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(currentInvitation.invitation_link)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={shareViaEmail} className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Share via Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentInvitation(null)}
                  >
                    Create Another
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>Expires:</strong> {new Date(currentInvitation.expires_at).toLocaleDateString()}</p>
                  <p><strong>Commission:</strong> 2% lifetime from {recruitType} revenue</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recruits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Recruits</CardTitle>
              <CardDescription>
                Track your recruited affiliates and their contribution to your earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recruits && stats.recruits.length > 0 ? (
                <div className="space-y-4">
                  {stats.recruits.map((recruit, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{recruit.recruit_name}</p>
                          <p className="text-sm text-gray-600 capitalize">{recruit.recruit_type}</p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(recruit.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={recruit.status === 'active' ? 'default' : 'secondary'}>
                          {recruit.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          ${recruit.earnings_generated?.toFixed(2) || '0.00'} earned
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recruits yet</p>
                  <p className="text-sm">Start recruiting to earn commissions!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}