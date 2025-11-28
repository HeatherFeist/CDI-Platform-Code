import React from 'react';
import { Link } from 'react-router-dom';
import { useBusinessContext } from '../contexts/SupabaseBusinessContext';
import { SupabaseSetupGuide } from './SupabaseSetupGuide';
import { ConfigurationStatus } from './ConfigurationStatus';
import { SetupBanner } from './common/SetupBanner';
import { useSetupStatus } from '../hooks/useSetupStatus';
import { DebugProfileLoader } from './DebugProfileLoader';

export const BusinessDashboard: React.FC = () => {
    const { metrics, isLoading, error } = useBusinessContext();
    const { status } = useSetupStatus();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading business data...</p>
            </div>
        );
    }
    
    if (error) {
        // Show configuration status and setup guide if it's a configuration error
        if (error.includes('Supabase configuration is missing') || error.includes('not configured')) {
            return (
                <div className="space-y-6">
                    <ConfigurationStatus />
                    <SupabaseSetupGuide />
                </div>
            );
        }
        return <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-red-800 font-semibold">Error Loading Business Data</h3>
            <p className="text-red-700">{error}</p>
        </div>;
    }
    
    // Always show the setup banner first, even if no metrics
    // This allows users to complete setup when business_id is missing
    return (
        <div>
            {/* DEBUG: Remove this after profile is fixed */}
            <DebugProfileLoader />
            
            {/* Setup Banner - Shows incomplete setup steps */}
            <SetupBanner />
            
            {!metrics ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <span className="material-icons text-blue-500 text-6xl mb-4">business</span>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Complete Your Business Setup</h2>
                    <p className="text-gray-600 mb-4">
                        Your business profile needs to be configured before you can view metrics and manage projects.
                    </p>
                    <Link 
                        to="/business/setup"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <span className="material-icons">settings</span>
                        <span>Complete Setup</span>
                    </Link>
                </div>
            ) : (
                <>
                    {/* Original dashboard content when metrics exist */}
            
            <h1 className="text-2xl font-bold mb-6">Business Dashboard</h1>

            {/* Programs Benefits Banner */}
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg shadow-lg p-6 mb-6 mt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className="material-icons text-5xl">volunteer_activism</span>
                        <div>
                            <h3 className="text-xl font-bold mb-1">Discover Your Benefits</h3>
                            <p className="text-sm text-blue-100">
                                Learn how our programs provide you with trained labor, wholesale materials, and new projects
                            </p>
                        </div>
                    </div>
                    <a
                        href="/business/programs"
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <span>See Programs</span>
                        <span className="material-icons">arrow_forward</span>
                    </a>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Quick Stats */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm">Active Projects</h3>
                    <p className="text-2xl font-bold">{metrics.activeProjects}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm">Upcoming Projects</h3>
                    <p className="text-2xl font-bold">{metrics.upcomingProjects}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm">Completed Projects</h3>
                    <p className="text-2xl font-bold">{metrics.projectsCompleted}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm">Total Revenue</h3>
                    <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                {/* Recent Activity */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Business Metrics</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Customer Satisfaction</p>
                                <p className="text-xs text-gray-500">Based on recent reviews</p>
                            </div>
                            <div className="flex items-center">
                                <span className="material-icons-outlined text-yellow-500 mr-1">star</span>
                                <span className="text-lg font-bold">{metrics.customerSatisfactionScore}/5.0</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Lead Conversion Rate</p>
                                <p className="text-xs text-gray-500">Last 30 days</p>
                            </div>
                            <div className="flex items-center">
                                <span className="material-icons-outlined text-green-500 mr-1">trending_up</span>
                                <span className="text-lg font-bold">{(metrics.leadConversionRate * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Average Project Value</p>
                                <p className="text-xs text-gray-500">Completed projects</p>
                            </div>
                            <div className="flex items-center">
                                <span className="material-icons-outlined text-blue-500 mr-1">payments</span>
                                <span className="text-lg font-bold">${metrics.averageProjectValue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
                    <div className="space-y-4">
                        <div className="relative pt-1">
                            <p className="text-sm font-medium mb-1">Project Completion Rate</p>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div 
                                    style={{ width: `${(metrics.projectsCompleted / (metrics.projectsCompleted + metrics.activeProjects) * 100).toFixed(1)}%` }} 
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                ></div>
                            </div>
                        </div>
                        <div className="relative pt-1">
                            <p className="text-sm font-medium mb-1">Revenue Target</p>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div 
                                    style={{ width: "85%" }} 
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                ></div>
                            </div>
                        </div>
                        <div className="relative pt-1">
                            <p className="text-sm font-medium mb-1">Customer Growth</p>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div 
                                    style={{ width: "65%" }} 
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                </>
            )}
        </div>
    );
};