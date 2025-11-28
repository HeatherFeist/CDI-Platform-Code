import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Spinner from './Spinner';

interface ToolRepair {
  id: string;
  tool_id: string;
  assigned_mechanic_id: string;
  issue_description: string;
  repair_status: 'pending' | 'in_progress' | 'completed' | 'parts_needed';
  estimated_cost: number;
  actual_cost: number;
  parts_used: any[];
  labor_hours: number;
  completed_at: string | null;
  before_photos: string[];
  after_photos: string[];
  notes: string;
  warranty_claim_id: string | null;
  tool: {
    brand: string;
    model: string;
    serial_number: string;
    category: string;
  };
}

interface MechanicStats {
  total_repairs: number;
  completed_repairs: number;
  total_earnings: number;
  average_repair_time: number;
  success_rate: number;
  total_labor_hours: number;
}

export default function ToolMechanicDashboard() {
  const [repairs, setRepairs] = useState<ToolRepair[]>([]);
  const [stats, setStats] = useState<MechanicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<ToolRepair | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Form states for repair updates
  const [laborHours, setLaborHours] = useState(0);
  const [partsUsed, setPartsUsed] = useState<Array<{name: string, cost: number}>>([]);
  const [repairNotes, setRepairNotes] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    loadMechanicData();
  }, []);

  const loadMechanicData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Load assigned repairs
      const { data: repairsData, error: repairsError } = await supabase
        .from('tool_repairs')
        .select(`
          *,
          tool:tool_inventory (
            brand,
            model,
            serial_number,
            category
          )
        `)
        .eq('assigned_mechanic_id', user.id)
        .order('created_at', { ascending: false });

      if (repairsError) throw repairsError;
      setRepairs(repairsData || []);

      // Load mechanic stats
      const { data: mechanicData, error: mechanicError } = await supabase
        .from('tool_mechanics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (mechanicError && mechanicError.code !== 'PGRST116') throw mechanicError;

      if (mechanicData) {
        const completedRepairs = repairsData?.filter(r => r.repair_status === 'completed').length || 0;
        const totalRepairs = repairsData?.length || 0;
        const totalHours = repairsData?.reduce((sum, r) => sum + (r.labor_hours || 0), 0) || 0;
        const totalEarnings = repairsData?.reduce((sum, r) => sum + (r.actual_cost || 0), 0) || 0;

        setStats({
          total_repairs: totalRepairs,
          completed_repairs: completedRepairs,
          total_earnings: totalEarnings,
          average_repair_time: totalRepairs > 0 ? totalHours / totalRepairs : 0,
          success_rate: totalRepairs > 0 ? (completedRepairs / totalRepairs) * 100 : 0,
          total_labor_hours: totalHours
        });
      }

    } catch (error) {
      console.error('Error loading mechanic data:', error);
      alert('Failed to load mechanic data');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File, folder: 'before' | 'after'): Promise<string> => {
    const fileName = `${currentUserId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('tool-repair-photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('tool-repair-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const startRepair = async (repairId: string) => {
    try {
      const { error } = await supabase
        .from('tool_repairs')
        .update({ repair_status: 'in_progress' })
        .eq('id', repairId);

      if (error) throw error;

      // Update local state
      setRepairs(repairs.map(r => 
        r.id === repairId ? { ...r, repair_status: 'in_progress' } : r
      ));

      alert('Repair started! Good luck! 🔧');
    } catch (error) {
      console.error('Error starting repair:', error);
      alert('Failed to start repair');
    }
  };

  const completeRepair = async () => {
    if (!selectedRepair) return;

    try {
      setUploadingPhotos(true);

      // Upload before photos
      const beforeUrls = await Promise.all(
        beforePhotos.map(photo => uploadPhoto(photo, 'before'))
      );

      // Upload after photos
      const afterUrls = await Promise.all(
        afterPhotos.map(photo => uploadPhoto(photo, 'after'))
      );

      // Calculate total cost
      const partsCost = partsUsed.reduce((sum, part) => sum + part.cost, 0);
      const laborCost = laborHours * 25; // $25/hour default rate
      const totalCost = partsCost + laborCost;

      // Update repair record
      const { error } = await supabase
        .from('tool_repairs')
        .update({
          repair_status: 'completed',
          labor_hours: laborHours,
          parts_used: partsUsed,
          actual_cost: totalCost,
          before_photos: [...(selectedRepair.before_photos || []), ...beforeUrls],
          after_photos: [...(selectedRepair.after_photos || []), ...afterUrls],
          notes: repairNotes,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedRepair.id);

      if (error) throw error;

      // Update tool status back to available
      const { error: toolError } = await supabase
        .from('tool_inventory')
        .update({ 
          current_status: 'available',
          condition: 'good' // Assume repair brings it to good condition
        })
        .eq('id', selectedRepair.tool_id);

      if (toolError) throw toolError;

      alert('Repair completed successfully! Tool is now available for rental. 🎉');
      setSelectedRepair(null);
      loadMechanicData();

    } catch (error) {
      console.error('Error completing repair:', error);
      alert('Failed to complete repair');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const markPartsNeeded = async (repairId: string, partsDescription: string) => {
    try {
      const { error } = await supabase
        .from('tool_repairs')
        .update({ 
          repair_status: 'parts_needed',
          notes: partsDescription
        })
        .eq('id', repairId);

      if (error) throw error;

      setRepairs(repairs.map(r => 
        r.id === repairId ? { ...r, repair_status: 'parts_needed', notes: partsDescription } : r
      ));

      alert('Marked as waiting for parts. Admin will be notified. 📦');
    } catch (error) {
      console.error('Error updating repair:', error);
      alert('Failed to update repair status');
    }
  };

  const addPart = () => {
    setPartsUsed([...partsUsed, { name: '', cost: 0 }]);
  };

  const updatePart = (index: number, field: 'name' | 'cost', value: string | number) => {
    const updated = [...partsUsed];
    if (field === 'name') {
      updated[index].name = value as string;
    } else {
      updated[index].cost = value as number;
    }
    setPartsUsed(updated);
  };

  const removePart = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'parts_needed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔧';
      case 'completed': return '✅';
      case 'parts_needed': return '📦';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔧 Tool Mechanic Dashboard
        </h1>
        <p className="text-gray-600">
          Repair queue and earnings tracker
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Repairs</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total_repairs}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">{stats.completed_repairs}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className="text-3xl font-bold text-blue-600">{stats.success_rate.toFixed(0)}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Hours</div>
            <div className="text-3xl font-bold text-purple-600">{stats.total_labor_hours.toFixed(1)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Earnings</div>
            <div className="text-3xl font-bold text-green-600">${stats.total_earnings.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Repair Queue */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Repair Queue</h2>
        </div>

        {repairs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <p className="text-gray-600 text-lg mb-2">No repairs assigned yet</p>
            <p className="text-gray-400 text-sm">
              Check back later or contact admin to be assigned repairs
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {repairs.map(repair => (
              <div key={repair.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getStatusIcon(repair.repair_status)}</span>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {repair.tool?.brand || 'Unknown'} {repair.tool?.model || 'Tool'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {repair.tool?.category || 'Category'} • SN: {repair.tool?.serial_number || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-700 font-medium">Issue:</p>
                      <p className="text-gray-600">{repair.issue_description}</p>
                    </div>

                    {repair.notes && (
                      <div className="mb-3">
                        <p className="text-gray-700 font-medium">Notes:</p>
                        <p className="text-gray-600">{repair.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Estimated: ${repair.estimated_cost?.toFixed(2) || '0.00'}</span>
                      {repair.labor_hours > 0 && (
                        <span>Labor: {repair.labor_hours}hrs</span>
                      )}
                      {repair.actual_cost > 0 && (
                        <span className="font-bold text-green-600">
                          Actual: ${repair.actual_cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(repair.repair_status)}`}>
                      {repair.repair_status.replace('_', ' ').toUpperCase()}
                    </span>

                    {repair.repair_status === 'pending' && (
                      <button
                        onClick={() => startRepair(repair.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Start Repair
                      </button>
                    )}

                    {repair.repair_status === 'in_progress' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedRepair(repair)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Complete Repair
                        </button>
                        <button
                          onClick={() => {
                            const parts = prompt('What parts are needed?');
                            if (parts) markPartsNeeded(repair.id, parts);
                          }}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                        >
                          Parts Needed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Repair Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Complete Repair: {selectedRepair.tool?.brand} {selectedRepair.tool?.model}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Labor Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Hours *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={laborHours}
                  onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="3.5"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Estimated earnings: ${(laborHours * 25).toFixed(2)} at $25/hr
                </p>
              </div>

              {/* Parts Used */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parts Used
                </label>
                {partsUsed.map((part, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={part.name}
                      onChange={(e) => updatePart(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Part name"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={part.cost}
                      onChange={(e) => updatePart(index, 'cost', parseFloat(e.target.value) || 0)}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Cost"
                    />
                    <button
                      onClick={() => removePart(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addPart}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Part
                </button>
                {partsUsed.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Parts total: ${partsUsed.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Before Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Before Photos *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setBeforePhotos(Array.from(e.target.files || []))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {beforePhotos.length} photo(s) selected
                </p>
              </div>

              {/* After Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  After Photos *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setAfterPhotos(Array.from(e.target.files || []))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {afterPhotos.length} photo(s) selected
                </p>
              </div>

              {/* Repair Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repair Notes
                </label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Describe what was done to repair the tool..."
                />
              </div>

              {/* Total Cost Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">Repair Cost Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Labor ({laborHours}hrs @ $25/hr):</span>
                    <span>${(laborHours * 25).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts:</span>
                    <span>${partsUsed.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                    <span>Total Cost:</span>
                    <span className="text-green-600">
                      ${(laborHours * 25 + partsUsed.reduce((sum, p) => sum + p.cost, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRepair(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={uploadingPhotos}
              >
                Cancel
              </button>
              <button
                onClick={completeRepair}
                disabled={uploadingPhotos || laborHours === 0 || beforePhotos.length === 0 || afterPhotos.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhotos ? 'Uploading Photos...' : 'Complete Repair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
