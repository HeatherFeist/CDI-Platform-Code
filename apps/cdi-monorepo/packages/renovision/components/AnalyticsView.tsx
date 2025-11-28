import React, { useState, useEffect } from 'react';
import { useBusinessContext } from '../contexts/SupabaseBusinessContext';

export const AnalyticsView: React.FC = () => {
    const { metrics, isLoading } = useBusinessContext();
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard
                    title="Total Revenue"
                    value={`$${metrics?.totalRevenue.toLocaleString() || 0}`}
                    change="+12.5%"
                    changeType="positive"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Projects Completed"
                    value={metrics?.projectsCompleted.toString() || '0'}
                    change="+8.2%"
                    changeType="positive"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Avg Project Value"
                    value={`$${metrics?.averageProjectValue.toLocaleString() || 0}`}
                    change="+5.3%"
                    changeType="positive"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Customer Satisfaction"
                    value={`${(metrics?.customerSatisfactionScore || 0).toFixed(1)}/5.0`}
                    change="+0.2"
                    changeType="positive"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p>Chart integration coming soon</p>
                            <p className="text-sm">Integrate Chart.js or Recharts</p>
                        </div>
                    </div>
                </div>

                {/* Project Status Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
                    <div className="space-y-4">
                        <StatusBar label="Active" value={metrics?.activeProjects || 0} color="bg-blue-500" percentage={40} />
                        <StatusBar label="Completed" value={metrics?.projectsCompleted || 0} color="bg-green-500" percentage={35} />
                        <StatusBar label="Upcoming" value={metrics?.upcomingProjects || 0} color="bg-yellow-500" percentage={15} />
                        <StatusBar label="On Hold" value={0} color="bg-gray-500" percentage={10} />
                    </div>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Conversion</h3>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                            {((metrics?.leadConversionRate || 0) * 100).toFixed(1)}%
                        </div>
                        <p className="text-gray-500">Average conversion rate</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Leads</span>
                            <span className="font-semibold">245</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Converted</span>
                            <span className="font-semibold">159</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Kitchen Remodel</span>
                            <span className="font-semibold">$125K</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Bathroom Renovation</span>
                            <span className="font-semibold">$89K</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Flooring</span>
                            <span className="font-semibold">$65K</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Painting</span>
                            <span className="font-semibold">$42K</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Projects Completed</span>
                            <span className="font-semibold">{metrics?.projectsCompleted || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Avg. Completion Time</span>
                            <span className="font-semibold">14 days</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">On-Time Delivery</span>
                            <span className="font-semibold">92%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Customer Reviews</span>
                            <span className="font-semibold">{metrics?.customerSatisfactionScore || 0}/5.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
                <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Export Revenue Report
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Export Project Report
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Export Customer Report
                    </button>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                        Export Team Report
                    </button>
                </div>
            </div>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500">{icon}</div>
                <span className={`text-sm font-semibold ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {change}
                </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="text-sm text-gray-600">{title}</div>
        </div>
    );
};

interface StatusBarProps {
    label: string;
    value: number;
    color: string;
    percentage: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ label, value, color, percentage }) => {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};
