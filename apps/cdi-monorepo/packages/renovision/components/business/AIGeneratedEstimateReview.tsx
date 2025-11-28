import React, { useState, useEffect } from 'react';
import { GeneratedEstimate, EstimateLineItem } from '../../services/geminiService';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface TeamMember {
    id: string;
    full_name: string;
    email: string;
    specialties: string[];
    hourly_rate?: number;
}

interface LineItemAssignment {
    lineItemIndex: number;
    teamMemberId: string;
    teamMemberName: string;
    estimatedHours: number;
    payAmount: number;
    notes?: string;
    invitationId?: string;
    invitationStatus?: 'pending' | 'sent' | 'accepted' | 'declined';
}

interface AIGeneratedEstimateReviewProps {
    estimate: GeneratedEstimate;
    onAccept: (estimate: GeneratedEstimate, assignments?: LineItemAssignment[]) => void;
    onEdit: () => void;
    onCancel: () => void;
}

export const AIGeneratedEstimateReview: React.FC<AIGeneratedEstimateReviewProps> = ({
    estimate: initialEstimate,
    onAccept,
    onEdit,
    onCancel
}) => {
    const { userProfile } = useAuth();
    const [estimate, setEstimate] = useState<GeneratedEstimate>(initialEstimate);
    const [editingItem, setEditingItem] = useState<number | null>(null);
    const [editingTaxRate, setEditingTaxRate] = useState(false);
    
    // AI Chat features
    const [showAIChat, setShowAIChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{role: string, message: string}>>([]);
    const [isProcessingChat, setIsProcessingChat] = useState(false);
    
    // Per-item AI chat
    const [activeItemChat, setActiveItemChat] = useState<number | null>(null);
    const [itemChatMessage, setItemChatMessage] = useState('');
    const [itemChatHistory, setItemChatHistory] = useState<{[key: number]: Array<{role: string, message: string}>}>({});
    const [isProcessingItemChat, setIsProcessingItemChat] = useState(false);
    
    // Team assignment features
    const [showTeamAssignment, setShowTeamAssignment] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignments, setAssignments] = useState<LineItemAssignment[]>([]);
    const [selectedLineItem, setSelectedLineItem] = useState<number | null>(null);
    
    // Recalculate feature
    const [isRecalculating, setIsRecalculating] = useState(false);
    
    // Finalization control
    const [canFinalizeEstimate, setCanFinalizeEstimate] = useState(true);
    const [pendingInvitations, setPendingInvitations] = useState<number>(0);

    // Load team members
    useEffect(() => {
        if (userProfile?.business_id) {
            loadTeamMembers();
        }
    }, [userProfile?.business_id]);

    // Check if all invitations are accepted
    useEffect(() => {
        const pending = assignments.filter(a => {
            // Check if invitation exists and is pending
            return true; // We'll track this when sending invitations
        }).length;
        setPendingInvitations(pending);
        setCanFinalizeEstimate(assignments.length === 0 || pending === 0);
    }, [assignments]);

    const loadTeamMembers = async () => {
        if (!userProfile?.business_id) return;
        
        const { data, error } = await supabase
            .from('team_members')
            .select('id, full_name, email, specialties, hourly_rate')
            .eq('business_id', userProfile.business_id)
            .eq('status', 'accepted');
            
        if (data && !error) {
            setTeamMembers(data);
        }
    };

    // Per-Item AI Chat Handler
    const handleItemAIChat = async (itemIndex: number) => {
        if (!itemChatMessage.trim()) return;
        
        setIsProcessingItemChat(true);
        
        const item = estimate.lineItems[itemIndex];
        const currentHistory = itemChatHistory[itemIndex] || [];
        
        setItemChatHistory({
            ...itemChatHistory,
            [itemIndex]: [...currentHistory, { role: 'user', message: itemChatMessage }]
        });
        
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment or add it in settings.');
            }
            
            const ai = new GoogleGenerativeAI(apiKey);
            const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
            
            const context = `
Current Line Item:
- Name: ${item.name}
- Description: ${item.description}
- Category: ${item.taskCategory}
- Quantity: ${item.quantity} ${item.unitType}
- Unit Cost: $${item.unitCost}
- Labor Cost: $${item.laborCost}
- Material Cost: $${item.materialCost}
- Equipment Cost: $${item.equipmentCost}
- Total: $${item.totalCost}
${item.notes ? '- Notes: ' + item.notes : ''}

Previous conversation:
${currentHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n')}

User's request: ${itemChatMessage}

Please provide specific suggestions or changes for this line item. Be concise and actionable.
If the user wants to modify pricing, quantities, or descriptions, provide the exact values to use.
`;
            
            const response = await model.generateContent(context);
            const result = await response.response;
            const aiResponse = result.text().trim();
            
            setItemChatHistory({
                ...itemChatHistory,
                [itemIndex]: [...currentHistory, 
                    { role: 'user', message: itemChatMessage },
                    { role: 'assistant', message: aiResponse }
                ]
            });
            setItemChatMessage('');
        } catch (error: any) {
            console.error('AI item chat error:', error);
            const errorMessage = error?.message || 'Unknown error occurred';
            alert(`Failed to process AI request: ${errorMessage}\n\nPlease check your API key in settings.`);
        } finally {
            setIsProcessingItemChat(false);
        }
    };

    const handleLineItemChange = (index: number, field: keyof EstimateLineItem, value: any) => {
        const newLineItems = [...estimate.lineItems];
        newLineItems[index] = { ...newLineItems[index], [field]: value };

        // Recalculate total cost for this line item based on what changed
        const item = newLineItems[index];
        
        if (field === 'quantity' || field === 'unitCost') {
            // When quantity or unit cost changes, recalculate total from unit cost
            item.totalCost = item.quantity * item.unitCost;
        } else if (field === 'laborCost' || field === 'materialCost' || field === 'equipmentCost') {
            // When individual cost components change, recalculate total
            item.totalCost = item.laborCost + item.materialCost + item.equipmentCost;
        }

        // Recalculate subtotal and grand total
        const subtotal = newLineItems.reduce((sum, item) => sum + item.totalCost, 0);
        const taxAmount = subtotal * estimate.taxRate;
        const total = subtotal + taxAmount;

        setEstimate({
            ...estimate,
            lineItems: newLineItems,
            subtotal,
            taxAmount,
            total
        });
    };

    const handleRemoveLineItem = (index: number) => {
        const newLineItems = estimate.lineItems.filter((_, i) => i !== index);
        const subtotal = newLineItems.reduce((sum, item) => sum + item.totalCost, 0);
        const taxAmount = subtotal * estimate.taxRate;
        const total = subtotal + taxAmount;

        setEstimate({
            ...estimate,
            lineItems: newLineItems,
            subtotal,
            taxAmount,
            total
        });
    };

    const handleTaxRateChange = (newRate: number) => {
        const taxAmount = estimate.subtotal * newRate;
        const total = estimate.subtotal + taxAmount;
        
        setEstimate({
            ...estimate,
            taxRate: newRate,
            taxAmount,
            total
        });
    };

    const handleResetEstimate = () => {
        if (window.confirm('Are you sure you want to reset this estimate to the original AI-generated values?')) {
            setEstimate(initialEstimate);
            setEditingItem(null);
            setEditingTaxRate(false);
        }
    };

    // AI Chat Handler
    const handleAIChat = async () => {
        if (!chatMessage.trim()) return;
        
        setIsProcessingChat(true);
        setChatHistory([...chatHistory, { role: 'user', message: chatMessage }]);
        
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment or add it in settings.');
            }
            
            const ai = new GoogleGenerativeAI(apiKey);
            const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
            
            const context = `
Current Estimate:
- Project: ${estimate.projectName}
- Description: ${estimate.projectDescription}
- Line Items: ${estimate.lineItems.map((item, i) => `\n  ${i+1}. ${item.name}: ${item.description} ($${item.totalCost})`).join('')}
- Total: $${estimate.total}

User's request: ${chatMessage}

Please provide specific changes to make to this estimate. Format your response as actionable changes.
`;
            
            const response = await model.generateContent(context);
            
            const result = await response.response;
            const aiResponse = result.text().trim();
            setChatHistory(prev => [...prev, { role: 'assistant', message: aiResponse }]);
            setChatMessage('');
        } catch (error: any) {
            console.error('AI chat error:', error);
            const errorMessage = error?.message || 'Unknown error occurred';
            alert(`Failed to process AI request: ${errorMessage}\n\nPlease check your API key in settings.`);
        } finally {
            setIsProcessingChat(false);
        }
    };

    // Recalculate Estimate - Generates clean professional version
    const handleRecalculateEstimate = async () => {
        if (!window.confirm('This will regenerate a clean, professional estimate based on your edited line items. Continue?')) {
            return;
        }
        
        setIsRecalculating(true);
        
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment or add it in settings.');
            }
            
            const ai = new GoogleGenerativeAI(apiKey);
            const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
            
            const prompt = `
You are a professional estimator. Based on the following edited line items, generate a clean, professional estimate description and organize the information formally.

Current Project: ${estimate.projectName}
Edited Line Items:
${estimate.lineItems.map((item, i) => `
${i+1}. ${item.name}
   Description: ${item.description}
   Category: ${item.taskCategory}
   Quantity: ${item.quantity} ${item.unitType}
   Labor: $${item.laborCost}
   Materials: $${item.materialCost}
   Equipment: $${item.equipmentCost}
   Total: $${item.totalCost}
   ${item.notes ? 'Notes: ' + item.notes : ''}
`).join('\n')}

Subtotal: $${estimate.subtotal}
Tax (${(estimate.taxRate * 100).toFixed(1)}%): $${estimate.taxAmount}
Total: $${estimate.total}
Duration: ${estimate.estimatedDuration} days

Please provide:
1. A refined professional project name (if needed)
2. A comprehensive project description incorporating all line items
3. A detailed scope of work section
4. Professional notes about the estimate

Return as JSON:
{
  "projectName": "refined name",
  "projectDescription": "comprehensive description",
  "scope": "detailed scope of work",
  "notes": "professional notes and assumptions"
}
`;
            
            const response = await model.generateContent(prompt);
            
            let result = (await response.response).text().trim();
            if (result.startsWith('```json')) {
                result = result.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            }
            
            const refined = JSON.parse(result);
            
            setEstimate({
                ...estimate,
                projectName: refined.projectName || estimate.projectName,
                projectDescription: refined.projectDescription || estimate.projectDescription,
                scope: refined.scope || estimate.scope,
                notes: refined.notes || estimate.notes
            });
            
            alert('Estimate recalculated successfully with professional formatting!');
        } catch (error: any) {
            console.error('Recalculation error:', error);
            const errorMessage = error?.message || 'Unknown error occurred';
            alert(`Failed to recalculate estimate: ${errorMessage}\n\nPlease check your API key in settings.`);
        } finally {
            setIsRecalculating(false);
        }
    };

    // Team Assignment Functions - Now supports multiple team members per task
    const handleAssignTeamMember = (lineItemIndex: number, teamMemberId: string) => {
        const teamMember = teamMembers.find(tm => tm.id === teamMemberId);
        if (!teamMember) return;
        
        // Check if this team member is already assigned to this line item
        const existingAssignment = assignments.find(
            a => a.lineItemIndex === lineItemIndex && a.teamMemberId === teamMemberId
        );
        
        if (existingAssignment) {
            alert(`${teamMember.full_name} is already assigned to this task.`);
            return;
        }
        
        const lineItem = estimate.lineItems[lineItemIndex];
        
        // Calculate hours based on remaining labor cost
        const assignedToThisItem = assignments.filter(a => a.lineItemIndex === lineItemIndex);
        const totalAssignedPay = assignedToThisItem.reduce((sum, a) => sum + a.payAmount, 0);
        const remainingLabor = lineItem.laborCost - totalAssignedPay;
        
        const estimatedHours = Math.round(remainingLabor / (teamMember.hourly_rate || 50));
        const suggestedPay = Math.min(remainingLabor, lineItem.laborCost);
        
        setAssignments([...assignments, {
            lineItemIndex,
            teamMemberId,
            teamMemberName: teamMember.full_name,
            estimatedHours: Math.max(1, estimatedHours),
            payAmount: Math.max(0, suggestedPay),
            notes: '',
            invitationStatus: 'pending'
        }]);
        
        setSelectedLineItem(null);
        setCanFinalizeEstimate(false); // Can't finalize until invitations are accepted
    };

    const handleUpdateAssignment = (index: number, field: keyof LineItemAssignment, value: any) => {
        const newAssignments = [...assignments];
        newAssignments[index] = { ...newAssignments[index], [field]: value };
        setAssignments(newAssignments);
    };

    const handleRemoveAssignment = (index: number) => {
        setAssignments(assignments.filter((_, i) => i !== index));
    };

    const handleSendTeamMemberOffer = async (assignment: LineItemAssignment) => {
        if (!userProfile?.business_id) return;
        
        const lineItem = estimate.lineItems[assignment.lineItemIndex];
        
        try {
            const { data, error } = await supabase
                .from('team_member_invitations')
                .insert({
                    business_id: userProfile.business_id,
                    team_member_id: assignment.teamMemberId,
                    project_name: estimate.projectName,
                    project_description: `${estimate.projectDescription}\n\nYour Task:\n${lineItem.name}\n${lineItem.description}`,
                    tasks: [{
                        name: lineItem.name,
                        description: lineItem.description,
                        category: lineItem.taskCategory,
                        estimated_hours: assignment.estimatedHours,
                        pay_amount: assignment.payAmount,
                        notes: assignment.notes || ''
                    }],
                    total_pay: assignment.payAmount,
                    estimated_hours: assignment.estimatedHours,
                    status: 'pending',
                    invitation_type: 'project_proposal'
                })
                .select()
                .single();
                
            if (error) throw error;
            
            // Update assignment with invitation ID
            const updatedAssignments = assignments.map(a => 
                a === assignment 
                    ? { ...a, invitationId: data.id, invitationStatus: 'sent' as const }
                    : a
            );
            setAssignments(updatedAssignments);
            
            alert(`Project proposal sent to ${assignment.teamMemberName}! They must accept before you can finalize the estimate.`);
        } catch (error) {
            console.error('Error sending offer:', error);
            alert('Failed to send offer. Please try again.');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {estimate.projectName}
                        </h2>
                        <p className="text-gray-600 mt-1">{estimate.projectDescription}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                        <span className="material-icons text-green-600">check_circle</span>
                        <span className="font-semibold text-green-800">AI Generated</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-600">Estimated Duration</p>
                        <p className="text-lg font-bold text-gray-900">{estimate.estimatedDuration} days</p>
                    </div>
                    {estimate.measurements.area && (
                        <div>
                            <p className="text-sm text-gray-600">Area</p>
                            <p className="text-lg font-bold text-gray-900">{estimate.measurements.area} sq ft</p>
                        </div>
                    )}
                    {estimate.measurements.rooms && (
                        <div>
                            <p className="text-sm text-gray-600">Rooms</p>
                            <p className="text-lg font-bold text-gray-900">{estimate.measurements.rooms}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-gray-600">Line Items</p>
                        <p className="text-lg font-bold text-gray-900">{estimate.lineItems.length}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">Click any item to edit</p>
                        <button
                            onClick={() => setShowAIChat(!showAIChat)}
                            className={`px-3 py-1 text-sm border-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                                showAIChat 
                                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                                : 'border-purple-400 text-purple-600 hover:bg-purple-50'
                            }`}
                            title="Chat with AI to make changes"
                        >
                            <span className="material-icons text-sm">chat</span>
                            AI Assistant
                        </button>
                        <button
                            onClick={handleResetEstimate}
                            className="px-3 py-1 text-sm border-2 border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center gap-1"
                            title="Reset to original AI values"
                        >
                            <span className="material-icons text-sm">refresh</span>
                            Reset All
                        </button>
                    </div>
                </div>

                {/* AI Chat Interface */}
                {showAIChat && (
                    <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                        <div className="flex items-start gap-2 mb-3">
                            <span className="material-icons text-purple-600">smart_toy</span>
                            <div className="flex-1">
                                <h4 className="font-semibold text-purple-900 mb-1">AI Estimate Assistant</h4>
                                <p className="text-sm text-purple-700 mb-3">
                                    Ask the AI to make changes to descriptions, add items, adjust pricing, or clarify details.
                                </p>
                                
                                {/* Chat History */}
                                {chatHistory.length > 0 && (
                                    <div className="mb-3 max-h-48 overflow-y-auto space-y-2">
                                        {chatHistory.map((msg, idx) => (
                                            <div key={idx} className={`p-2 rounded ${
                                                msg.role === 'user' 
                                                ? 'bg-purple-100 ml-4' 
                                                : 'bg-white mr-4'
                                            }`}>
                                                <p className="text-xs font-semibold text-purple-900 mb-1">
                                                    {msg.role === 'user' ? 'You' : 'AI'}
                                                </p>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Chat Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                                        placeholder="e.g., 'Add paint primer to the bathroom task' or 'Increase labor hours for flooring'"
                                        className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        disabled={isProcessingChat}
                                    />
                                    <button
                                        onClick={handleAIChat}
                                        disabled={isProcessingChat || !chatMessage.trim()}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <span className="material-icons text-sm">send</span>
                                        {isProcessingChat ? 'Processing...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {estimate.lineItems.map((item, index) => (
                        <div
                            key={index}
                            className={`
                                border rounded-lg p-4 transition-all
                                ${editingItem === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                            `}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    {editingItem === index ? (
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleLineItemChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-1 border border-gray-300 rounded font-semibold"
                                        />
                                    ) : (
                                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                    )}
                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                            {item.taskCategory}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                            {item.unitType}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => setActiveItemChat(activeItemChat === index ? null : index)}
                                        className={`p-2 rounded transition-colors ${
                                            activeItemChat === index 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'text-purple-600 hover:bg-purple-50'
                                        }`}
                                        title="Chat with AI about this item"
                                    >
                                        <span className="material-icons text-sm">chat</span>
                                    </button>
                                    <button
                                        onClick={() => setEditingItem(editingItem === index ? null : index)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit item"
                                    >
                                        <span className="material-icons text-sm">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleRemoveLineItem(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Remove item"
                                    >
                                        <span className="material-icons text-sm">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Per-Item AI Chat */}
                            {activeItemChat === index && (
                                <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="material-icons text-purple-600 text-sm">smart_toy</span>
                                        <div className="flex-1">
                                            <h5 className="font-semibold text-purple-900 text-sm mb-1">AI Assistant for: {item.name}</h5>
                                            <p className="text-xs text-purple-700 mb-2">
                                                Ask about pricing adjustments, description changes, or additional details for this specific task.
                                            </p>
                                            
                                            {/* Item Chat History */}
                                            {itemChatHistory[index] && itemChatHistory[index].length > 0 && (
                                                <div className="mb-2 max-h-32 overflow-y-auto space-y-1">
                                                    {itemChatHistory[index].map((msg, idx) => (
                                                        <div key={idx} className={`p-2 rounded text-xs ${
                                                            msg.role === 'user' 
                                                            ? 'bg-purple-200 ml-4' 
                                                            : 'bg-white mr-4 border border-purple-200'
                                                        }`}>
                                                            <p className="font-semibold text-purple-900 mb-0.5">
                                                                {msg.role === 'user' ? 'You' : 'AI'}
                                                            </p>
                                                            <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Item Chat Input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={itemChatMessage}
                                                    onChange={(e) => setItemChatMessage(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleItemAIChat(index)}
                                                    placeholder="e.g., 'Add $200 for premium paint' or 'Include cleanup in description'"
                                                    className="flex-1 px-2 py-1 border border-purple-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    disabled={isProcessingItemChat}
                                                />
                                                <button
                                                    onClick={() => handleItemAIChat(index)}
                                                    disabled={isProcessingItemChat || !itemChatMessage.trim()}
                                                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-1"
                                                >
                                                    <span className="material-icons" style={{fontSize: '14px'}}>send</span>
                                                    {isProcessingItemChat ? 'Processing...' : 'Ask'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-3 pt-3 border-t border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500">Quantity</p>
                                    {editingItem === index ? (
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            step="0.01"
                                        />
                                    ) : (
                                        <p className="font-semibold">{item.quantity}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Unit Cost</p>
                                    {editingItem === index ? (
                                        <input
                                            type="number"
                                            value={item.unitCost}
                                            onChange={(e) => handleLineItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            step="0.01"
                                        />
                                    ) : (
                                        <p className="font-semibold">{formatCurrency(item.unitCost)}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Labor</p>
                                    {editingItem === index ? (
                                        <input
                                            type="number"
                                            value={item.laborCost}
                                            onChange={(e) => handleLineItemChange(index, 'laborCost', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                                            step="0.01"
                                        />
                                    ) : (
                                        <p className="font-semibold text-blue-600">{formatCurrency(item.laborCost)}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Materials</p>
                                    {editingItem === index ? (
                                        <input
                                            type="number"
                                            value={item.materialCost}
                                            onChange={(e) => handleLineItemChange(index, 'materialCost', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border border-green-300 rounded text-sm"
                                            step="0.01"
                                        />
                                    ) : (
                                        <p className="font-semibold text-green-600">{formatCurrency(item.materialCost)}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Equipment</p>
                                    {editingItem === index ? (
                                        <input
                                            type="number"
                                            value={item.equipmentCost}
                                            onChange={(e) => handleLineItemChange(index, 'equipmentCost', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 border border-purple-300 rounded text-sm"
                                            step="0.01"
                                        />
                                    ) : (
                                        <p className="font-semibold text-purple-600">{formatCurrency(item.equipmentCost)}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total</p>
                                    <p className="font-bold text-gray-900">{formatCurrency(item.totalCost)}</p>
                                </div>
                            </div>

                            {/* Team Member Assignment Section */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                        <span className="material-icons text-sm">people</span>
                                        Team Assignments ({assignments.filter(a => a.lineItemIndex === index).length})
                                    </h5>
                                    <button
                                        onClick={() => setSelectedLineItem(selectedLineItem === index ? null : index)}
                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                                    >
                                        <span className="material-icons" style={{fontSize: '14px'}}>add</span>
                                        Add Team Member
                                    </button>
                                </div>

                                {/* Show remaining labor budget */}
                                {(() => {
                                    const assignedToThisItem = assignments.filter(a => a.lineItemIndex === index);
                                    const totalAssignedPay = assignedToThisItem.reduce((sum, a) => sum + a.payAmount, 0);
                                    const remainingLabor = item.laborCost - totalAssignedPay;
                                    
                                    if (assignedToThisItem.length > 0 && remainingLabor > 0) {
                                        return (
                                            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                                                <span className="font-medium text-amber-900">
                                                    Remaining labor budget: {formatCurrency(remainingLabor)}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Assignment Selector */}
                                {selectedLineItem === index && (
                                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-xs text-blue-900 mb-2 font-medium">
                                            Select additional team member for this task:
                                        </p>
                                        <div className="space-y-1">
                                            {teamMembers.length === 0 ? (
                                                <p className="text-xs text-gray-600 italic">No team members available. Add team members first.</p>
                                            ) : (
                                                teamMembers.map(member => {
                                                    const alreadyAssigned = assignments.some(
                                                        a => a.lineItemIndex === index && a.teamMemberId === member.id
                                                    );
                                                    return (
                                                        <button
                                                            key={member.id}
                                                            onClick={() => handleAssignTeamMember(index, member.id)}
                                                            disabled={alreadyAssigned}
                                                            className={`w-full text-left p-2 border rounded transition-colors ${
                                                                alreadyAssigned
                                                                ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                                                : 'bg-white border-blue-200 hover:bg-blue-50'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {member.full_name}
                                                                        {alreadyAssigned && <span className="text-xs text-gray-500 ml-1">(Already assigned)</span>}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600">
                                                                        {member.specialties.slice(0, 2).join(', ')}
                                                                    </p>
                                                                </div>
                                                                {member.hourly_rate && (
                                                                    <p className="text-xs text-blue-600 font-medium">
                                                                        ${member.hourly_rate}/hr
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Show All Assignments for this item */}
                                {assignments.filter(a => a.lineItemIndex === index).length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">No team members assigned yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {assignments.filter(a => a.lineItemIndex === index).map((assignment, assignIdx) => {
                                            const fullAssignmentIndex = assignments.findIndex(a => a === assignment);
                                            const statusColor = {
                                                'pending': 'yellow',
                                                'sent': 'blue',
                                                'accepted': 'green',
                                                'declined': 'red'
                                            }[assignment.invitationStatus || 'pending'];
                                            
                                            return (
                                                <div key={assignIdx} className={`p-3 bg-${statusColor}-50 border border-${statusColor}-200 rounded`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`material-icons text-${statusColor}-600 text-sm`}>
                                                                {assignment.invitationStatus === 'accepted' ? 'check_circle' : 
                                                                 assignment.invitationStatus === 'declined' ? 'cancel' :
                                                                 assignment.invitationStatus === 'sent' ? 'schedule' : 'pending'}
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{assignment.teamMemberName}</p>
                                                                <p className="text-xs text-gray-700">
                                                                    Status: {assignment.invitationStatus === 'sent' ? 'Proposal Sent - Awaiting Response' :
                                                                            assignment.invitationStatus === 'accepted' ? '✓ Accepted' :
                                                                            assignment.invitationStatus === 'declined' ? '✗ Declined' :
                                                                            'Draft - Not yet sent'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveAssignment(fullAssignmentIndex)}
                                                            className="text-red-600 hover:bg-red-100 p-1 rounded"
                                                            title="Remove assignment"
                                                            disabled={assignment.invitationStatus === 'accepted'}
                                                        >
                                                            <span className="material-icons text-sm">close</span>
                                                        </button>
                                                    </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <label className="text-xs text-gray-600">Estimated Hours</label>
                                                    <input
                                                        type="number"
                                                        value={assignment.estimatedHours}
                                                        onChange={(e) => handleUpdateAssignment(fullAssignmentIndex, 'estimatedHours', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        step="0.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-600">Pay Amount</label>
                                                    <input
                                                        type="number"
                                                        value={assignment.payAmount}
                                                        onChange={(e) => handleUpdateAssignment(fullAssignmentIndex, 'payAmount', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mb-2">
                                                <label className="text-xs text-gray-600">Task Notes (optional)</label>
                                                <textarea
                                                    value={assignment.notes || ''}
                                                    onChange={(e) => handleUpdateAssignment(fullAssignmentIndex, 'notes', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    rows={2}
                                                    placeholder="Additional instructions or notes for team member..."
                                                />
                                            </div>
                                            
                                            <button
                                                onClick={() => handleSendTeamMemberOffer(assignment)}
                                                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-1 text-sm font-medium"
                                            >
                                                <span className="material-icons text-sm">send</span>
                                                Send Offer to {assignment.teamMemberName}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex flex-col gap-2 max-w-md ml-auto">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700">Subtotal</span>
                        <span className="text-xl font-semibold">{formatCurrency(estimate.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-700">Tax</span>
                            {editingTaxRate ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={(estimate.taxRate * 100).toFixed(2)}
                                        onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) / 100 || 0)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                    />
                                    <span className="text-sm">%</span>
                                    <button
                                        onClick={() => setEditingTaxRate(false)}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                        title="Done editing"
                                    >
                                        <span className="material-icons text-sm">check</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditingTaxRate(true)}
                                    className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1"
                                    title="Edit tax rate"
                                >
                                    <span>({(estimate.taxRate * 100).toFixed(1)}%)</span>
                                    <span className="material-icons text-xs">edit</span>
                                </button>
                            )}
                        </div>
                        <span className="text-xl font-semibold">{formatCurrency(estimate.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-green-600">{formatCurrency(estimate.total)}</span>
                            <button
                                onClick={handleRecalculateEstimate}
                                disabled={isRecalculating}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                title="Regenerate professional estimate from your edits"
                            >
                                <span className="material-icons text-sm">{isRecalculating ? 'hourglass_empty' : 'auto_fix_high'}</span>
                                {isRecalculating ? 'Recalculating...' : 'Recalculate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {estimate.notes && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <span className="material-icons text-amber-600">info</span>
                        <div>
                            <h4 className="font-semibold text-amber-900 mb-1">Notes & Assumptions</h4>
                            <p className="text-sm text-amber-800 whitespace-pre-wrap">{estimate.notes}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Assignments Summary */}
            {assignments.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <span className="material-icons text-blue-600">people</span>
                        <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 mb-2">Team Assignments Summary</h4>
                            <div className="space-y-2">
                                {assignments.map((assignment, idx) => {
                                    const lineItem = estimate.lineItems[assignment.lineItemIndex];
                                    const statusIcon = {
                                        'accepted': 'check_circle',
                                        'sent': 'schedule',
                                        'declined': 'cancel',
                                        'pending': 'pending'
                                    }[assignment.invitationStatus || 'pending'];
                                    
                                    const statusColor = {
                                        'accepted': 'text-green-600',
                                        'sent': 'text-blue-600',
                                        'declined': 'text-red-600',
                                        'pending': 'text-yellow-600'
                                    }[assignment.invitationStatus || 'pending'];
                                    
                                    return (
                                        <div key={idx} className="p-2 bg-white rounded border border-blue-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-2">
                                                    <span className={`material-icons text-sm ${statusColor}`}>{statusIcon}</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{assignment.teamMemberName}</p>
                                                        <p className="text-xs text-gray-600">{lineItem.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Status: {assignment.invitationStatus === 'accepted' ? '✓ Accepted' :
                                                                    assignment.invitationStatus === 'sent' ? 'Awaiting Response' :
                                                                    assignment.invitationStatus === 'declined' ? 'Declined' :
                                                                    'Not sent yet'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-blue-700">{formatCurrency(assignment.payAmount)}</p>
                                                    <p className="text-xs text-gray-600">{assignment.estimatedHours}h</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-blue-700 mt-2 italic">
                                These assignments will be included in the estimate and visible to the client.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Finalization Warning */}
            {!canFinalizeEstimate && assignments.length > 0 && (
                <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-amber-600">warning</span>
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-900 mb-1">Cannot Finalize Yet</h4>
                            <p className="text-sm text-amber-800">
                                {(() => {
                                    const pendingCount = assignments.filter(a => !a.invitationStatus || a.invitationStatus === 'pending').length;
                                    const sentCount = assignments.filter(a => a.invitationStatus === 'sent').length;
                                    const declinedCount = assignments.filter(a => a.invitationStatus === 'declined').length;
                                    
                                    if (pendingCount > 0) {
                                        return `${pendingCount} proposal${pendingCount > 1 ? 's have' : ' has'} not been sent yet. Please send all proposals to team members.`;
                                    } else if (sentCount > 0) {
                                        return `Waiting for ${sentCount} team member${sentCount > 1 ? 's' : ''} to accept their proposal${sentCount > 1 ? 's' : ''}. You cannot finalize this estimate until all proposals are accepted.`;
                                    } else if (declinedCount > 0) {
                                        return `${declinedCount} team member${declinedCount > 1 ? 's have' : ' has'} declined. Please remove declined assignments or assign different team members.`;
                                    }
                                    return 'All team member proposals must be accepted before finalizing.';
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => onAccept(estimate, assignments)}
                    disabled={!canFinalizeEstimate && assignments.length > 0}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                        !canFinalizeEstimate && assignments.length > 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover:shadow-xl'
                    }`}
                >
                    {!canFinalizeEstimate && assignments.length > 0 && (
                        <span className="material-icons text-sm">lock</span>
                    )}
                    <span className="material-icons">check_circle</span>
                    <span>Accept & Create Estimate {assignments.length > 0 && `(${assignments.length} assignments)`}</span>
                </button>

                <button
                    onClick={onEdit}
                    className="px-6 py-3 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                    <span className="material-icons">edit</span>
                    <span>Start Over</span>
                </button>

                <button
                    onClick={onCancel}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default AIGeneratedEstimateReview;
