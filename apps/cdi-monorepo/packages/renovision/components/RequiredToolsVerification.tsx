import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Spinner from './Spinner';

interface RequiredTool {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
}

interface ToolVerification {
  tool_id: string;
  tool_name: string;
  verification_status: 'unverified' | 'owned' | 'rented' | 'purchasing';
  rental_agreement_id?: string;
  rental_start_date?: string;
  notes?: string;
}

interface Props {
  projectTeamMemberId: string;
  requiredTools: RequiredTool[];
  onVerificationComplete: (verifications: ToolVerification[]) => void;
  isReadOnly?: boolean;
}

export default function RequiredToolsVerification({ 
  projectTeamMemberId, 
  requiredTools, 
  onVerificationComplete,
  isReadOnly = false 
}: Props) {
  const [verifications, setVerifications] = useState<ToolVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<RequiredTool | null>(null);
  const [availableRentals, setAvailableRentals] = useState<any[]>([]);

  useEffect(() => {
    loadVerifications();
  }, [projectTeamMemberId]);

  const loadVerifications = async () => {
    try {
      setLoading(true);

      // Load existing verifications from database
      const { data, error } = await supabase
        .from('project_team_members')
        .select('tools_verification_details')
        .eq('id', projectTeamMemberId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.tools_verification_details) {
        setVerifications(data.tools_verification_details);
      } else {
        // Initialize verifications for all required tools
        const initialVerifications = requiredTools.map(tool => ({
          tool_id: tool.id,
          tool_name: tool.name,
          verification_status: 'unverified' as const,
        }));
        setVerifications(initialVerifications);
      }

    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVerification = async (toolId: string, status: ToolVerification['verification_status'], additionalData?: Partial<ToolVerification>) => {
    const updatedVerifications = verifications.map(v =>
      v.tool_id === toolId
        ? { ...v, verification_status: status, ...additionalData }
        : v
    );

    setVerifications(updatedVerifications);

    // Save to database
    try {
      const { error } = await supabase
        .from('project_team_members')
        .update({
          tools_verification_details: updatedVerifications,
          tools_verification_status: allToolsVerified(updatedVerifications) ? 'verified' : 'unverified'
        })
        .eq('id', projectTeamMemberId);

      if (error) throw error;

      // Notify parent component
      if (allToolsVerified(updatedVerifications)) {
        onVerificationComplete(updatedVerifications);
      }

    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Failed to update tool verification');
    }
  };

  const allToolsVerified = (verificationsList: ToolVerification[]) => {
    return verificationsList.every(v => v.verification_status !== 'unverified');
  };

  const searchAvailableRentals = async (toolName: string) => {
    try {
      const { data, error } = await supabase
        .from('tool_inventory')
        .select(`
          *,
          brand:tool_brands (
            name,
            warranty_period_months
          ),
          category:tool_categories (
            name
          )
        `)
        .eq('current_status', 'available')
        .or(`model.ilike.%${toolName}%,category.name.ilike.%${toolName}%`);

      if (error) throw error;

      setAvailableRentals(data || []);
      setShowRentalModal(true);

    } catch (error) {
      console.error('Error searching rentals:', error);
      alert('Failed to search for available rentals');
    }
  };

  const initiateRental = async (tool: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate rental rate using the SQL function
      const { data: rateData, error: rateError } = await supabase
        .rpc('calculate_tool_rental_rate', {
          p_brand_id: tool.brand_id,
          p_warranty_months: tool.brand.warranty_period_months,
          p_purchase_cost: tool.purchase_cost
        });

      if (rateError) throw rateError;

      const weeklyRate = rateData;

      // Create rental agreement
      const { data: agreementData, error: agreementError } = await supabase
        .from('tool_rental_agreements')
        .insert([{
          member_id: user.id,
          tool_id: tool.id,
          weekly_payment_amount: weeklyRate,
          total_amount_to_own: tool.retail_price,
          agreement_status: 'pending'
        }])
        .select()
        .single();

      if (agreementError) throw agreementError;

      // Update verification
      await updateVerification(selectedTool!.id, 'rented', {
        rental_agreement_id: agreementData.id,
        rental_start_date: new Date().toISOString(),
        notes: `Renting ${tool.brand.name} ${tool.model} at $${weeklyRate.toFixed(2)}/week`
      });

      alert(`✅ Rental initiated! $${weeklyRate.toFixed(2)}/week will be deducted from your project earnings.`);
      setShowRentalModal(false);
      setSelectedTool(null);

    } catch (error) {
      console.error('Error initiating rental:', error);
      alert('Failed to initiate rental');
    }
  };

  const getStatusIcon = (status: ToolVerification['verification_status']) => {
    switch (status) {
      case 'unverified': return '❓';
      case 'owned': return '✅';
      case 'rented': return '🔧';
      case 'purchasing': return '🛒';
      default: return '❓';
    }
  };

  const getStatusColor = (status: ToolVerification['verification_status']) => {
    switch (status) {
      case 'unverified': return 'bg-red-100 text-red-800';
      case 'owned': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'purchasing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const allVerified = allToolsVerified(verifications);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🔧 Required Tools Verification
            </h3>
            <p className="text-sm text-gray-600">
              {isReadOnly 
                ? 'Review the tools required for this project'
                : 'Please verify that you have or can obtain all required tools before accepting this project'
              }
            </p>
          </div>
          {allVerified && (
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
              <span className="text-2xl">✅</span>
              <span className="text-sm font-bold text-green-800">All Tools Verified</span>
            </div>
          )}
        </div>

        {!allVerified && !isReadOnly && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-yellow-900 mb-1">Action Required</p>
                <p className="text-sm text-yellow-800">
                  You must verify all tools before you can accept this project invitation. 
                  If you don't own a tool, you can rent it from our tool library at affordable weekly rates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tools List */}
      <div className="space-y-4">
        {requiredTools.map((tool, index) => {
          const verification = verifications.find(v => v.tool_id === tool.id);
          
          return (
            <div key={tool.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getStatusIcon(verification?.verification_status || 'unverified')}</span>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{tool.name}</h4>
                        <p className="text-sm text-gray-600">
                          {tool.category} • Quantity: {tool.quantity}
                        </p>
                      </div>
                    </div>
                    
                    {tool.description && (
                      <p className="text-sm text-gray-700 mb-3 ml-12">
                        {tool.description}
                      </p>
                    )}

                    {verification?.notes && (
                      <div className="ml-12 bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-900">
                          <strong>Note:</strong> {verification.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(verification?.verification_status || 'unverified')}`}>
                    {verification?.verification_status?.replace('_', ' ').toUpperCase() || 'UNVERIFIED'}
                  </span>
                </div>

                {!isReadOnly && verification?.verification_status === 'unverified' && (
                  <div className="ml-12 space-y-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      How will you obtain this tool?
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => updateVerification(tool.id, 'owned', {
                          notes: 'I already own this tool'
                        })}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <span className="text-xl">✅</span>
                        <span className="font-medium">I Own This</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTool(tool);
                          searchAvailableRentals(tool.name);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span className="text-xl">🔧</span>
                        <span className="font-medium">Rent from Library</span>
                      </button>

                      <button
                        onClick={() => updateVerification(tool.id, 'purchasing', {
                          notes: 'I will purchase this tool before project start'
                        })}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <span className="text-xl">🛒</span>
                        <span className="font-medium">Will Purchase</span>
                      </button>
                    </div>
                  </div>
                )}

                {verification?.verification_status === 'rented' && verification.rental_agreement_id && (
                  <div className="ml-12 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Rental Active:</strong> Weekly payments will be automatically deducted from your project earnings.
                      Once paid off, the tool is yours to keep! 🎉
                    </p>
                  </div>
                )}

                {verification?.verification_status === 'purchasing' && (
                  <div className="ml-12 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-900">
                      <strong>Reminder:</strong> Please purchase this tool before the project start date. 
                      You can change to "Rent from Library" if needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rental Modal */}
      {showRentalModal && selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Rentals: {selectedTool.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose a tool to rent. Weekly payments are automatically deducted from your project earnings.
              </p>
            </div>

            <div className="p-6">
              {availableRentals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😔</div>
                  <p className="text-gray-600 text-lg mb-2">No available rentals found</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Try searching for a similar tool or contact support for assistance.
                  </p>
                  <button
                    onClick={() => setShowRentalModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRentals.map(tool => {
                    const weeklyRate = (tool.retail_price / (tool.brand.warranty_period_months * 4.33)).toFixed(2);
                    
                    return (
                      <div key={tool.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                        {tool.photo_url && (
                          <img
                            src={tool.photo_url}
                            alt={tool.model}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                        )}
                        
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          {tool.brand?.name} {tool.model}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {tool.category?.name} • Condition: {tool.condition}
                        </p>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Weekly Payment:</span>
                            <span className="font-bold text-blue-600">${weeklyRate}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Own After:</span>
                            <span className="font-medium">{tool.brand.warranty_period_months} months</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total to Own:</span>
                            <span className="font-bold text-green-600">${tool.retail_price.toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => initiateRental(tool)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Rent This Tool
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowRentalModal(false);
                  setSelectedTool(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Blocker Warning */}
      {!allVerified && !isReadOnly && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🚫</span>
            <div>
              <p className="font-bold text-red-900 mb-2">Project Cannot Start</p>
              <p className="text-sm text-red-800 mb-3">
                Until all tools are verified, you cannot accept this project invitation and milestone payments cannot begin.
                This ensures everyone is ready on day one and prevents costly delays.
              </p>
              <p className="text-sm text-red-700">
                <strong>Tools Remaining:</strong> {requiredTools.length - verifications.filter(v => v.verification_status !== 'unverified').length} / {requiredTools.length} verified
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
