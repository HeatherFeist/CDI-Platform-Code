import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Spinner from './Spinner';

interface Tool {
  id: string;
  brand_id: string;
  category_id: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_cost: number;
  retail_price: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'broken';
  warranty_expiration: string;
  current_status: 'available' | 'rented' | 'in_repair' | 'donated' | 'warranty_holder';
  is_warranty_holder: boolean;
  notes: string;
  photo_url: string;
  brand: {
    name: string;
    warranty_period_months: number;
  };
  category: {
    name: string;
  };
}

interface Brand {
  id: string;
  name: string;
  warranty_period_months: number;
  bulk_discount_percentage: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function ToolInventoryManagement() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'rented' | 'in_repair' | 'warranty_holder'>('all');

  // Form states
  const [formData, setFormData] = useState({
    brand_id: '',
    category_id: '',
    model: '',
    serial_number: '',
    purchase_cost: 0,
    retail_price: 0,
    condition: 'excellent' as const,
    warranty_expiration: '',
    is_warranty_holder: false,
    notes: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);

      // Load brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('tool_brands')
        .select('*')
        .order('name');

      if (brandsError) throw brandsError;
      setBrands(brandsData || []);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('tool_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load tools
      const { data: toolsData, error: toolsError } = await supabase
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
        .order('created_at', { ascending: false });

      if (toolsError) throw toolsError;
      setTools(toolsData || []);

    } catch (error) {
      console.error('Error loading inventory:', error);
      alert('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileName = `tools/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('tool-photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('tool-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const addTool = async () => {
    try {
      setUploadingPhoto(true);

      let photoUrl = '';
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // Calculate warranty expiration based on brand
      const selectedBrand = brands.find(b => b.id === formData.brand_id);
      const warrantyMonths = selectedBrand?.warranty_period_months || 12;
      const warrantyExpiration = new Date();
      warrantyExpiration.setMonth(warrantyExpiration.getMonth() + warrantyMonths);

      const { data, error } = await supabase
        .from('tool_inventory')
        .insert([{
          ...formData,
          warranty_expiration: formData.warranty_expiration || warrantyExpiration.toISOString(),
          photo_url: photoUrl,
          current_status: formData.is_warranty_holder ? 'warranty_holder' : 'available',
          purchase_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      alert('Tool added successfully! 🔧');
      setShowAddModal(false);
      resetForm();
      loadInventoryData();

    } catch (error) {
      console.error('Error adding tool:', error);
      alert('Failed to add tool');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateToolStatus = async (toolId: string, newStatus: string, newCondition?: string) => {
    try {
      const updates: any = { current_status: newStatus };
      if (newCondition) {
        updates.condition = newCondition;
      }

      const { error } = await supabase
        .from('tool_inventory')
        .update(updates)
        .eq('id', toolId);

      if (error) throw error;

      setTools(tools.map(t => 
        t.id === toolId ? { ...t, ...updates } : t
      ));

      alert('Tool status updated! ✅');
    } catch (error) {
      console.error('Error updating tool:', error);
      alert('Failed to update tool status');
    }
  };

  const submitWarrantyClaim = async (toolId: string) => {
    try {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return;

      // Check if warranty is still valid
      const warrantyExpiration = new Date(tool.warranty_expiration);
      const now = new Date();
      
      if (warrantyExpiration < now) {
        alert('⚠️ Warranty has expired! Cannot submit claim.');
        return;
      }

      const reason = prompt('Describe the issue with the tool:');
      if (!reason) return;

      // Create warranty claim
      const { data: claimData, error: claimError } = await supabase
        .from('tool_warranty_claims')
        .insert([{
          tool_id: toolId,
          claim_reason: reason,
          claim_status: 'pending',
          claimed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (claimError) throw claimError;

      // Update tool status
      await updateToolStatus(toolId, 'in_repair');

      alert('Warranty claim submitted! 📋\nThe tool will be marked as in repair until replacement arrives.');

    } catch (error) {
      console.error('Error submitting warranty claim:', error);
      alert('Failed to submit warranty claim');
    }
  };

  const bulkImportTools = async () => {
    const csvData = prompt(`Paste CSV data in format:
Brand,Category,Model,Serial Number,Purchase Cost,Retail Price,Condition,Is Warranty Holder

Example:
DeWalt,Power Tools,DCD771C2,SN12345,120.00,299.00,excellent,false
Milwaukee,Power Tools,2767-20,SN67890,180.00,399.00,excellent,true`);

    if (!csvData) return;

    try {
      const lines = csvData.trim().split('\n');
      const tools = [];

      for (let i = 1; i < lines.length; i++) { // Skip header
        const [brandName, categoryName, model, serial, purchaseCost, retailPrice, condition, isWarrantyHolder] = 
          lines[i].split(',').map(s => s.trim());

        // Find brand and category IDs
        const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
        const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());

        if (!brand || !category) {
          console.warn(`Skipping ${model}: Brand or category not found`);
          continue;
        }

        // Calculate warranty expiration
        const warrantyExpiration = new Date();
        warrantyExpiration.setMonth(warrantyExpiration.getMonth() + brand.warranty_period_months);

        tools.push({
          brand_id: brand.id,
          category_id: category.id,
          model,
          serial_number: serial,
          purchase_cost: parseFloat(purchaseCost),
          retail_price: parseFloat(retailPrice),
          condition: condition as any,
          warranty_expiration: warrantyExpiration.toISOString(),
          is_warranty_holder: isWarrantyHolder.toLowerCase() === 'true',
          current_status: isWarrantyHolder.toLowerCase() === 'true' ? 'warranty_holder' : 'available',
          purchase_date: new Date().toISOString()
        });
      }

      if (tools.length === 0) {
        alert('No valid tools found in CSV data');
        return;
      }

      const { error } = await supabase
        .from('tool_inventory')
        .insert(tools);

      if (error) throw error;

      alert(`✅ Successfully imported ${tools.length} tools!`);
      loadInventoryData();

    } catch (error) {
      console.error('Error importing tools:', error);
      alert('Failed to import tools. Check console for details.');
    }
  };

  const resetForm = () => {
    setFormData({
      brand_id: '',
      category_id: '',
      model: '',
      serial_number: '',
      purchase_cost: 0,
      retail_price: 0,
      condition: 'excellent',
      warranty_expiration: '',
      is_warranty_holder: false,
      notes: ''
    });
    setPhotoFile(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'in_repair': return 'bg-orange-100 text-orange-800';
      case 'donated': return 'bg-purple-100 text-purple-800';
      case 'warranty_holder': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'broken': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredTools = filter === 'all' 
    ? tools 
    : tools.filter(t => t.current_status === filter);

  const stats = {
    total: tools.length,
    available: tools.filter(t => t.current_status === 'available').length,
    rented: tools.filter(t => t.current_status === 'rented').length,
    in_repair: tools.filter(t => t.current_status === 'in_repair').length,
    warranty_holders: tools.filter(t => t.is_warranty_holder).length,
    total_value: tools.reduce((sum, t) => sum + t.retail_price, 0),
    total_cost: tools.reduce((sum, t) => sum + t.purchase_cost, 0)
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
          🛠️ Tool Inventory Management
        </h1>
        <p className="text-gray-600">
          Track tools, manage warranties, and monitor rental availability
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">Total Tools</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">Available</div>
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">Rented</div>
          <div className="text-2xl font-bold text-blue-600">{stats.rented}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">In Repair</div>
          <div className="text-2xl font-bold text-orange-600">{stats.in_repair}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">Warranty</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.warranty_holders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">Retail Value</div>
          <div className="text-2xl font-bold text-green-600">${stats.total_value.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">Total Cost</div>
          <div className="text-2xl font-bold text-gray-900">${stats.total_cost.toLocaleString()}</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'available' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Available ({stats.available})
            </button>
            <button
              onClick={() => setFilter('rented')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'rented' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rented ({stats.rented})
            </button>
            <button
              onClick={() => setFilter('in_repair')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'in_repair' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Repair ({stats.in_repair})
            </button>
            <button
              onClick={() => setFilter('warranty_holder')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'warranty_holder' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Warranty Holders ({stats.warranty_holders})
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={bulkImportTools}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              📋 Bulk Import
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Add Tool
            </button>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map(tool => (
          <div key={tool.id} className="bg-white rounded-lg shadow overflow-hidden">
            {tool.photo_url && (
              <img
                src={tool.photo_url}
                alt={tool.model}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {tool.brand?.name} {tool.model}
                  </h3>
                  <p className="text-sm text-gray-600">{tool.category?.name}</p>
                </div>
                {tool.is_warranty_holder && (
                  <span className="text-2xl" title="Warranty Holder">🛡️</span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Serial:</span>
                  <span className="font-mono">{tool.serial_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Condition:</span>
                  <span className={`font-medium ${getConditionColor(tool.condition)}`}>
                    {tool.condition.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost:</span>
                  <span>${tool.purchase_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Retail:</span>
                  <span className="font-bold">${tool.retail_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Warranty:</span>
                  <span className={
                    new Date(tool.warranty_expiration) > new Date() 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }>
                    {new Date(tool.warranty_expiration).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tool.current_status)}`}>
                  {tool.current_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {tool.current_status === 'available' && (
                  <button
                    onClick={() => updateToolStatus(tool.id, 'rented')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Mark Rented
                  </button>
                )}

                {tool.current_status === 'rented' && (
                  <button
                    onClick={() => updateToolStatus(tool.id, 'available')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Mark Returned
                  </button>
                )}

                {(tool.current_status === 'available' || tool.current_status === 'rented') && (
                  <button
                    onClick={() => submitWarrantyClaim(tool.id)}
                    className="flex-1 px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                  >
                    Warranty Claim
                  </button>
                )}

                {tool.notes && (
                  <button
                    onClick={() => alert(tool.notes)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    📝 Notes
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <p className="text-gray-600 text-lg">No tools found for this filter</p>
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Tool</h2>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({...formData, brand_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name} ({brand.warranty_period_months}mo warranty)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="DCD771C2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="SN123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Cost *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({...formData, purchase_cost: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="120.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retail Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.retail_price}
                    onChange={(e) => setFormData({...formData, retail_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="299.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="excellent">Excellent (Brand New)</option>
                  <option value="good">Good (Lightly Used)</option>
                  <option value="fair">Fair (Shows Wear)</option>
                  <option value="poor">Poor (Heavy Wear)</option>
                  <option value="broken">Broken (Needs Repair)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isWarrantyHolder"
                  checked={formData.is_warranty_holder}
                  onChange={(e) => setFormData({...formData, is_warranty_holder: e.target.checked})}
                  className="w-5 h-5"
                />
                <label htmlFor="isWarrantyHolder" className="text-sm font-medium text-gray-700">
                  🛡️ This is a warranty holder (keep new for claims, rent used tools instead)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Any additional information about this tool..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={uploadingPhoto}
              >
                Cancel
              </button>
              <button
                onClick={addTool}
                disabled={
                  uploadingPhoto || 
                  !formData.brand_id || 
                  !formData.category_id || 
                  !formData.model || 
                  !formData.serial_number ||
                  formData.purchase_cost === 0 ||
                  formData.retail_price === 0
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? 'Uploading...' : 'Add Tool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
