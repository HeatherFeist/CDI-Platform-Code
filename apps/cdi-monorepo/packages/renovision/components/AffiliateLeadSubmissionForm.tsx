import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/supabase';

interface AffiliateStats {
  total_leads_submitted: number;
  total_leads_completed: number;
  total_earnings: number;
  completion_rate: number;
}

export default function AffiliateLeadSubmissionForm() {
  const [affiliateId, setAffiliateId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  
  // Form fields
  const [location, setLocation] = useState('');
  const [timeline, setTimeline] = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Extract affiliate ID from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('affiliate_id') || window.location.pathname.split('/').pop();
    
    if (id && id.startsWith('af_')) {
      setAffiliateId(id);
      loadAffiliateStats(id);
    }
  }, []);

  // Load affiliate stats
  const loadAffiliateStats = async (id: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_affiliate_dashboard_stats', { p_affiliate_id: id });

      if (error) throw error;
      
      if (data) {
        setBusinessName(data.business_name || 'Affiliate');
        setStats({
          total_leads_submitted: data.total_leads_submitted || 0,
          total_leads_completed: data.total_leads_completed || 0,
          total_earnings: parseFloat(data.total_earnings?.replace('$', '').replace(',', '') || '0'),
          completion_rate: parseFloat(data.completion_rate?.replace('%', '') || '0')
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Voice-to-text for notes field
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNotes(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    // Auto-stop after 30 seconds
    setTimeout(() => {
      recognition.stop();
    }, 30000);
  };

  // Submit lead
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!affiliateId) {
      setError('Invalid affiliate ID. Please use the link provided in your welcome email.');
      return;
    }

    if (!location || !timeline || !budget) {
      setError('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call Supabase Edge Function
      const { data, error: submitError } = await supabase.functions.invoke('submit-affiliate-lead', {
        body: {
          affiliate_id: affiliateId,
          location,
          timeline,
          duration: duration || 'Not specified',
          budget: parseFloat(budget.replace(/[^0-9.]/g, '')),
          notes: notes || 'No additional notes provided'
        }
      });

      if (submitError) throw submitError;

      // Success!
      setShowSuccess(true);
      
      // Clear form
      setLocation('');
      setTimeline('');
      setDuration('');
      setBudget('');
      setNotes('');

      // Reload stats
      await loadAffiliateStats(affiliateId);

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);

    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Submit Lead to Constructive Designs
          </h1>
          <p className="text-gray-600">
            {businessName} | Affiliate ID: {affiliateId || 'Loading...'}
          </p>
        </div>

        {/* Stats Card */}
        {stats && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_leads_submitted}</div>
                  <div className="text-sm text-gray-600">Leads Submitted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.total_leads_completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${stats.total_earnings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stats.completion_rate.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {showSuccess && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Lead Submitted Successfully!</p>
                  <p className="text-sm">Our project manager will review and follow up with the client.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit a Lead</CardTitle>
            <p className="text-sm text-gray-600">
              Got a lead you can't take? Submit it in 30 seconds and earn 5% commission when completed.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📍 Where <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Spokane, WA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📅 When <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="ASAP, Next week, Next month..."
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ⏱️ Duration (optional)
                </label>
                <Input
                  type="text"
                  placeholder="2-3 weeks, 1 week, 5 days..."
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💰 Pay (Client's Budget) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="$8,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your commission: {budget ? `$${(parseFloat(budget.replace(/[^0-9.]/g, '')) * 0.05).toFixed(0)}` : '$0'} (5%)
                </p>
              </div>

              {/* Notes with Voice Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📝 Notes
                </label>
                <div className="relative">
                  <Textarea
                    placeholder="Bathroom remodel, master bath, tile shower, new vanity... Include client name and contact if you have it."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={startVoiceInput}
                    disabled={isListening}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                  </Button>
                </div>
                {isListening && (
                  <p className="text-xs text-red-500 mt-1">Listening... (speak now)</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to Project Manager
                  </>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              How It Works
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1. Fill out the 5 fields above (takes 30 seconds)</li>
              <li>2. Click "Send to Project Manager" (instant submission)</li>
              <li>3. Our PM contacts the client and qualifies the lead</li>
              <li>4. Lead is assigned to one of our contractors or goes to competition</li>
              <li>5. You earn <strong>5% commission</strong> when the job completes (paid via ACH or check)</li>
            </ol>
            <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-xs text-gray-600">
                <strong>Example:</strong> $8,000 bathroom remodel = <strong className="text-green-600">$400</strong> commission for you
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center text-sm text-gray-600">
          <p>Questions? Contact us at <a href="mailto:affiliates@constructivedesignsinc.org" className="text-blue-600 hover:underline">affiliates@constructivedesignsinc.org</a></p>
        </div>

      </div>
    </div>
  );
}
