/**
 * Utility functions for formatting text and field names
 */

/**
 * Converts underscore-separated field names to properly formatted display text
 * Example: "team_members" -> "Team Members"
 * Example: "first_name" -> "First Name"
 */
export const formatFieldName = (field: string): string => {
    if (!field) return '';
    
    return field
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Converts camelCase to Title Case with spaces
 * Example: "businessOwner" -> "Business Owner"
 */
export const formatCamelCase = (text: string): string => {
    if (!text) return '';
    
    return text
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

/**
 * Formats a role string for display
 * Example: "business_owner" -> "Business Owner"
 * Example: "team_member" -> "Team Member"
 */
export const formatRole = (role: string): string => {
    if (!role) return '';
    
    const roleMap: { [key: string]: string } = {
        'business_owner': 'Business Owner',
        'team_member': 'Team Member',
        'contractor': 'Contractor',
        'subcontractor': 'Subcontractor',
        'admin': 'Administrator',
        'manager': 'Manager',
        'technician': 'Technician',
        'sales': 'Sales'
    };
    
    return roleMap[role] || formatFieldName(role);
};

/**
 * Truncates text to a specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Formats a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Formats a date string to include time
 */
export const formatDateTime = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
