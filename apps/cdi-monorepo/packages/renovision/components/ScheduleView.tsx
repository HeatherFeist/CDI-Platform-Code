import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface Appointment {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
    customer_id?: string;
    project_id?: string;
    google_calendar_event_id?: string;
    notes?: string;
    customer?: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
    project?: {
        name: string;
    };
}

interface CalendarSettings {
    google_calendar_enabled: boolean;
    sync_enabled: boolean;
}

export default function ScheduleView() {
    const { userProfile } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [customers, setCustomers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    const [newAppointment, setNewAppointment] = useState({
        title: '',
        description: '',
        customer_id: '',
        project_id: '',
        start_time: '',
        end_time: '',
        location: '',
        notes: ''
    });

    useEffect(() => {
        if (userProfile?.business_id) {
            fetchAppointments();
            fetchCalendarSettings();
            fetchCustomers();
            fetchProjects();
        }
    }, [userProfile, currentDate, viewMode]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    customer:customers(*),
                    project:projects(name)
                `)
                .eq('business_id', userProfile!.business_id)
                .gte('start_time', getStartOfPeriod().toISOString())
                .lte('start_time', getEndOfPeriod().toISOString())
                .order('start_time', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendarSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('calendar_settings')
                .select('*')
                .eq('business_id', userProfile!.business_id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setCalendarSettings(data);
        } catch (error) {
            console.error('Error fetching calendar settings:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', userProfile!.business_id)
                .order('first_name');

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('business_id', userProfile!.business_id)
                .order('name');

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const getStartOfPeriod = () => {
        const date = new Date(currentDate);
        if (viewMode === 'day') {
            date.setHours(0, 0, 0, 0);
        } else if (viewMode === 'week') {
            const day = date.getDay();
            date.setDate(date.getDate() - day);
            date.setHours(0, 0, 0, 0);
        } else {
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
        }
        return date;
    };

    const getEndOfPeriod = () => {
        const date = new Date(currentDate);
        if (viewMode === 'day') {
            date.setHours(23, 59, 59, 999);
        } else if (viewMode === 'week') {
            const day = date.getDay();
            date.setDate(date.getDate() + (6 - day));
            date.setHours(23, 59, 59, 999);
        } else {
            date.setMonth(date.getMonth() + 1);
            date.setDate(0);
            date.setHours(23, 59, 59, 999);
        }
        return date;
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert({
                    business_id: userProfile!.business_id,
                    created_by: userProfile!.id,
                    ...newAppointment
                })
                .select()
                .single();

            if (error) throw error;

            // If Google Calendar is enabled, sync the event
            if (calendarSettings?.google_calendar_enabled && calendarSettings?.sync_enabled) {
                await syncToGoogleCalendar(data);
            }

            setShowNewAppointment(false);
            setNewAppointment({
                title: '',
                description: '',
                customer_id: '',
                project_id: '',
                start_time: '',
                end_time: '',
                location: '',
                notes: ''
            });
            fetchAppointments();
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Failed to create appointment');
        }
    };

    const syncToGoogleCalendar = async (appointment: Appointment) => {
        // This would integrate with Google Calendar API
        // For now, it's a placeholder for future implementation
        console.log('Syncing to Google Calendar:', appointment);
    };

    const updateAppointmentStatus = async (appointmentId: string, status: string) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', appointmentId);

            if (error) throw error;
            fetchAppointments();
        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Failed to update appointment');
        }
    };

    const deleteAppointment = async (appointmentId: string) => {
        if (!confirm('Are you sure you want to delete this appointment?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointmentId);

            if (error) throw error;
            fetchAppointments();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Failed to delete appointment');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'no_show': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const navigatePeriod = (direction: 'prev' | 'next') => {
        const date = new Date(currentDate);
        if (viewMode === 'day') {
            date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
        } else if (viewMode === 'week') {
            date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
                    <p className="text-gray-600 mt-1">Manage appointments and sync with Google Calendar</p>
                </div>
                <button
                    onClick={() => setShowNewAppointment(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                    <span className="material-icons text-sm">add</span>
                    <span>New Appointment</span>
                </button>
            </div>

            {/* Google Calendar Status */}
            {calendarSettings?.google_calendar_enabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="material-icons text-green-600">event</span>
                        <div>
                            <p className="font-semibold text-green-900">Google Calendar Connected</p>
                            <p className="text-sm text-green-700">Appointments are automatically synced</p>
                        </div>
                    </div>
                    <a
                        href="/business/calendar-settings"
                        className="text-green-700 hover:text-green-900 text-sm font-medium"
                    >
                        Settings
                    </a>
                </div>
            )}

            {/* Calendar Controls */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigatePeriod('prev')}
                            className="p-2 hover:bg-gray-100 rounded"
                        >
                            <span className="material-icons">chevron_left</span>
                        </button>
                        <h2 className="text-xl font-semibold">
                            {currentDate.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                                ...(viewMode === 'day' && { day: 'numeric' })
                            })}
                        </h2>
                        <button
                            onClick={() => navigatePeriod('next')}
                            className="p-2 hover:bg-gray-100 rounded"
                        >
                            <span className="material-icons">chevron_right</span>
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Today
                        </button>
                    </div>

                    <div className="flex space-x-2">
                        {['day', 'week', 'month'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as any)}
                                className={`px-4 py-2 rounded ${
                                    viewMode === mode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
                {appointments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <span className="material-icons text-6xl text-gray-300 mb-4">event_available</span>
                        <p className="text-gray-600">No appointments scheduled for this period</p>
                        <button
                            onClick={() => setShowNewAppointment(true)}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Schedule your first appointment
                        </button>
                    </div>
                ) : (
                    appointments.map((appointment) => (
                        <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                            {appointment.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {appointment.google_calendar_event_id && (
                                            <span className="text-green-600 text-sm flex items-center">
                                                <span className="material-icons text-sm mr-1">event</span>
                                                Synced
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="material-icons text-sm">schedule</span>
                                            <span>{formatDate(appointment.start_time)} • {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                                        </div>
                                        {appointment.location && (
                                            <div className="flex items-center space-x-2">
                                                <span className="material-icons text-sm">location_on</span>
                                                <span>{appointment.location}</span>
                                            </div>
                                        )}
                                        {appointment.customer && (
                                            <div className="flex items-center space-x-2">
                                                <span className="material-icons text-sm">person</span>
                                                <span>{appointment.customer.first_name} {appointment.customer.last_name}</span>
                                            </div>
                                        )}
                                        {appointment.project && (
                                            <div className="flex items-center space-x-2">
                                                <span className="material-icons text-sm">work</span>
                                                <span>{appointment.project.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {appointment.description && (
                                        <p className="text-sm text-gray-700 mb-2">{appointment.description}</p>
                                    )}

                                    {appointment.notes && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-gray-700">
                                            <strong>Notes:</strong> {appointment.notes}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col space-y-2 ml-4">
                                    {appointment.status === 'scheduled' && (
                                        <button
                                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {['scheduled', 'confirmed'].includes(appointment.status) && (
                                        <>
                                            <button
                                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                            >
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => deleteAppointment(appointment.id)}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Appointment Modal */}
            {showNewAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
                                <button
                                    onClick={() => setShowNewAppointment(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleCreateAppointment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newAppointment.title}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Kitchen Consultation"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={newAppointment.start_time}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, start_time: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={newAppointment.end_time}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, end_time: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Customer
                                        </label>
                                        <select
                                            value={newAppointment.customer_id}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, customer_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select customer (optional)</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.first_name} {customer.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Project
                                        </label>
                                        <select
                                            value={newAppointment.project_id}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, project_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select project (optional)</option>
                                            {projects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={newAppointment.location}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., 123 Main St, City, State"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newAppointment.description}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add appointment details..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={newAppointment.notes}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Internal notes (not visible to customer)..."
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        Create Appointment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewAppointment(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
