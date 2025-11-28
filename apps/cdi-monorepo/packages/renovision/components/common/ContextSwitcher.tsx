import React from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

export default function ContextSwitcher() {
    const { currentContext, availableContexts, switchContext, userProfile } = useAuth();

    if (availableContexts.length <= 1) {
        return null; // Don't show if only one context
    }

    const getContextIcon = (context: string) => {
        switch (context) {
            case 'business_owner': return 'business';
            case 'contractor': return 'engineering';
            case 'team_member': return 'groups';
            case 'subcontractor': return 'handyman';
            default: return 'person';
        }
    };

    const getContextColor = (context: string) => {
        switch (context) {
            case 'business_owner': return 'blue';
            case 'contractor': return 'purple';
            case 'team_member': return 'green';
            case 'subcontractor': return 'orange';
            default: return 'gray';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Your Role</h3>
                <span className="material-icons text-sm text-gray-400">swap_horiz</span>
            </div>
            
            <div className="space-y-2">
                {availableContexts.map((ctx, idx) => {
                    const isActive = ctx.context === currentContext;
                    const color = getContextColor(ctx.context);
                    
                    return (
                        <button
                            key={idx}
                            onClick={() => switchContext(ctx.context, ctx.businessId || ctx.teamMemberId)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                isActive
                                    ? `bg-${color}-50 border-2 border-${color}-500`
                                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                            }`}
                        >
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                isActive ? `bg-${color}-500` : 'bg-gray-300'
                            }`}>
                                <span className={`material-icons text-sm ${
                                    isActive ? 'text-white' : 'text-gray-600'
                                }`}>
                                    {getContextIcon(ctx.context)}
                                </span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${
                                    isActive ? `text-${color}-900` : 'text-gray-900'
                                }`}>
                                    {ctx.label}
                                </p>
                                <p className={`text-xs ${
                                    isActive ? `text-${color}-700` : 'text-gray-500'
                                }`}>
                                    {ctx.context.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>
                            {isActive && (
                                <span className={`material-icons text-sm text-${color}-500`}>
                                    check_circle
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                    <span className="material-icons text-xs align-middle mr-1">info</span>
                    Switch between roles based on what you're working on
                </p>
            </div>
        </div>
    );
}
