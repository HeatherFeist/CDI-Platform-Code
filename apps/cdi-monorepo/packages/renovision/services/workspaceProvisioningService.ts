/**
 * Workspace Provisioning Service
 * 
 * This service handles automatic Google Workspace account creation
 * during user signup. It uses Google Admin SDK to provision accounts
 * with @constructivedesignsinc.org email addresses.
 * 
 * Flow:
 * 1. User signs up with first name, last name, personal email
 * 2. Firebase account created
 * 3. Google Workspace account auto-created: firstname.lastname@constructivedesignsinc.org
 * 4. Profile saved with both emails
 * 5. User receives welcome email with temp password
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// ========================================
// CONFIGURATION
// ========================================

const SERVICE_ACCOUNT_EMAIL = 'home-reno-vision-pro@appspot.gserviceaccount.com';
const WORKSPACE_DOMAIN = 'constructivedesignsinc.org';

// TODO: Update this with your actual admin email
const ADMIN_EMAIL = 'heather.feist@constructivedesignsinc.org';

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYKZBu4MjwJUPS
y/vNJ3hqd3jljUppibLJ4FEaaTH9MPBYmuR0M65mDYJSQAiM128986S+YAxs/xM0
BSLygodakTmgdFi3ULj2YVpy0spLkEMER0D1TObbY0ssRIw3s6qKJyVbDEik6gtO
ULciz1xRFKCpXc61Eka2SyMcomxiktoNTR4id6dxz4eGsE/hXgNqmQvtl/tKgiNd
psEt0BtM8+rgFl5zA+XO+Pwv8cL9dDaE4bm/zpg3ihE5qO1OwQs2gsWrKW4vHX3h
yN+Dhxxx62bu6yTBeTzCmzQ5eNTs3mIj4SN8EqzWXN5l8Urf9t9d/oMe34hHdG/b
WFe+ByItAgMBAAECggEAAYTRpTLdXpNDH0k8EL8TM5MbXGhZOWKDc7OTV2Bh4NHE
9cGel3tLaf2WitiBkYpOLOjHGQHPD73/Rv6tgt4SwZAR1FZXE3Bl8efEpL52lZWi
9U+FUxthGr6OPqVdp7gSkxI619Bp/4W1zQ9R0/cahwCVhL3MWJG5p8ThfCCJ1YVD
fatjYiudeZJmqxomw2v/zkKWQJa82Jj8+SuSRJoL5qQv89mqx/vMhb+mEYcAaERg
zqwL83nPYPLjKNq/X33DeWsqYG7+uddGcPZGVlQ3zMFnrnpqlkoLNPYcxWZfF8tX
pgGGoAfQAgUxP057s1iqUesztR92VvnoeNUja1FI8QKBgQDlp8PCyta+2E0kvGk+
OoaFB35E4GMUePWo4+rOjUWlNW1he+WCWKeWb6s2sW4phQnUojUS635VEIO+mcUh
zH1W7xZHkICVSiOAp315Hn4Epymgccp7MQgCUiItVUIUQR86uPqe///Aod7PD5gj
QZms2WujKN/XFh2z0RW7B2zmsQKBgQDw9Y31zgaHALRoPI7g0XTmv/zCYG1DeUZM
VloJAmC6ODPhpOQdF3i0sXpnXAaIBaZ78xTlSSM6lglZE/czTwFVzExtRzvSlUXi
cqq+Y2SCl9bx+1E7yo7E7geieRkdqUWL8PhFjuiV0AjLK7DeVGDinrWIP3k2jM9t
+Rzv5/VKPQKBgQDLJyr/B9wLmuAzHRCkYbVZvJUwbKZ5F7+IlYXDDimLycVmtOkD
81TcuQ/mI/Lle7CEjrEQeY2ZxjAkzXYbPf+qhXlZ+TQl3B2n04IlQJoNl6o1KjQJ
4gfJtcpR+9emfy0XD0d0m9UsHIUy+gKFPaSpyPN0s9W/OOsxhEYK2ri1IQKBgC30
dw2hLGeE/+M9YXaJHAWCKh+cKlqK/5hBg8xiEraRT3vCaesOdevoSVL7HxfEFBth
oeOUzk43HTNK9oNnlvaZDx5sToF8DKcCfYPwCtRJRypBZx3DJPVz/CrFc7/Pb78f
xwnlFoCz+2lcPNA6QXwXDsIccO6xbkIoF5e9om91AoGAZj8DCZC5Y3VVf9F++TyG
0kaxT05Cy3c/hPL8s2m+VTStt9KMWg+mGXe7DYsa927NtO1OwpF37daS4mgxtZTG
GiFA1nGDk4LbJw6/Vt61U6/ecPd8TwVzYb108Jk9+UjjD8Hgesq0bRpmisYhgMBf
C1ub8DnIxbSBEmZrENryWY4=
-----END PRIVATE KEY-----`;

// ========================================
// TYPES
// ========================================

export interface WorkspaceProvisioningResult {
    success: boolean;
    workspaceEmail?: string;
    tempPassword?: string;
    error?: string;
}

export interface UserSignupData {
    firstName: string;
    lastName: string;
    personalEmail: string;
    firebaseUid: string;
}

// ========================================
// ADMIN SDK CLIENT
// ========================================

/**
 * Create authenticated Google Admin SDK client
 */
function createAdminClient() {
    try {
        const jwtClient = new JWT({
            email: SERVICE_ACCOUNT_EMAIL,
            key: PRIVATE_KEY,
            scopes: [
                'https://www.googleapis.com/auth/admin.directory.user',
                'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
            ],
            subject: ADMIN_EMAIL, // Impersonate admin
        });

        return google.admin({ version: 'directory_v1', auth: jwtClient as any });
    } catch (error) {
        console.error('❌ Failed to create Admin SDK client:', error);
        throw new Error('Google Workspace configuration error');
    }
}

// ========================================
// EMAIL GENERATION
// ========================================

/**
 * Generate workspace email from name
 * Format: firstname.lastname@constructivedesignsinc.org
 * Handles conflicts by adding numbers
 */
function generateWorkspaceEmail(firstName: string, lastName: string, attempt: number = 0): string {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    
    if (!cleanFirst || !cleanLast) {
        throw new Error('Invalid first or last name');
    }
    
    const username = attempt === 0
        ? `${cleanFirst}.${cleanLast}`
        : `${cleanFirst}.${cleanLast}${attempt}`;
    
    return `${username}@${WORKSPACE_DOMAIN}`;
}

/**
 * Check if user exists in Workspace
 */
async function userExists(email: string): Promise<boolean> {
    try {
        const admin = createAdminClient();
        await admin.users.get({ userKey: email });
        return true;
    } catch (error: any) {
        if (error.code === 404) {
            return false;
        }
        console.error('Error checking user existence:', error);
        throw error;
    }
}

// ========================================
// PASSWORD GENERATION
// ========================================

/**
 * Generate secure temporary password
 * Format: 10 random chars + Aa1! for complexity requirements
 */
function generateTempPassword(): string {
    const randomPart = Math.random().toString(36).slice(-10);
    return `${randomPart}Aa1!`; // Meets Google password requirements
}

// ========================================
// MAIN PROVISIONING FUNCTION
// ========================================

/**
 * Provision Google Workspace account for new user
 * 
 * This is called during signup to automatically create
 * a @constructivedesignsinc.org email for the user.
 */
export async function provisionWorkspaceAccount(
    userData: UserSignupData
): Promise<WorkspaceProvisioningResult> {
    try {
        console.log('🔄 Provisioning Workspace account for:', userData.firstName, userData.lastName);

        // Step 1: Generate unique email
        let workspaceEmail = '';
        let attempt = 0;
        
        while (attempt < 10) {
            workspaceEmail = generateWorkspaceEmail(userData.firstName, userData.lastName, attempt);
            const exists = await userExists(workspaceEmail);
            
            if (!exists) {
                break;
            }
            
            console.log(`⚠️ Email ${workspaceEmail} already exists, trying ${attempt + 1}...`);
            attempt++;
        }

        if (attempt >= 10) {
            return {
                success: false,
                error: 'Could not generate unique email after 10 attempts',
            };
        }

        console.log('✅ Generated unique email:', workspaceEmail);

        // Step 2: Generate temporary password
        const tempPassword = generateTempPassword();

        // Step 3: Create user in Google Workspace
        const admin = createAdminClient();
        
        const response = await admin.users.insert({
            requestBody: {
                primaryEmail: workspaceEmail,
                name: {
                    givenName: userData.firstName,
                    familyName: userData.lastName,
                    fullName: `${userData.firstName} ${userData.lastName}`,
                },
                password: tempPassword,
                changePasswordAtNextLogin: true, // Force change on first login
                orgUnitPath: '/', // Root org unit
            },
        });

        console.log('✅ Workspace account created:', response.data.primaryEmail);

        return {
            success: true,
            workspaceEmail,
            tempPassword,
        };

    } catch (error: any) {
        console.error('❌ Error provisioning Workspace account:', error);
        return {
            success: false,
            error: error.message || 'Failed to create Workspace account',
        };
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if workspace integration is configured
 */
export function isWorkspaceConfigured(): boolean {
    return !!(SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY && ADMIN_EMAIL && WORKSPACE_DOMAIN);
}

/**
 * Test workspace connection
 */
export async function testWorkspaceConnection(): Promise<boolean> {
    try {
        const admin = createAdminClient();
        // Try to get admin user to test connection
        await admin.users.get({ userKey: ADMIN_EMAIL });
        console.log('✅ Workspace connection successful');
        return true;
    } catch (error) {
        console.error('❌ Workspace connection failed:', error);
        return false;
    }
}
