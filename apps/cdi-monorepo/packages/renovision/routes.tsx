import { createBrowserRouter } from 'react-router-dom';
import { BusinessLayout } from './components/BusinessLayout';
import { BusinessDashboard } from './components/BusinessDashboard';
import { CustomersView } from './components/CustomersView';
import { BusinessProjectsView } from './components/BusinessProjectsView';
import { EstimatesView } from './components/EstimatesView';
import { InvoicesView } from './components/InvoicesView';
import { PaymentSettingsView } from './components/PaymentSettingsView';
import { TransactionsView } from './components/TransactionsView';
import ScheduleView from './components/ScheduleView';
import CalendarSettingsView from './components/CalendarSettingsView';
import ProgramsBenefitsView from './components/ProgramsBenefitsView';
import { TeamView } from './components/TeamView';
import { AnalyticsView } from './components/AnalyticsView';
import { LoginPage } from './components/LoginPage';
import { PublicPaymentPage } from './components/PublicPaymentPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import Canvas from './components/Canvas';
import { DiagnosticsPage } from './components/DiagnosticsPage';
import { TestDesignsPage } from './components/TestDesignsPage';

// New collaboration components
import TeamMembersView from './components/business/TeamMembersView';
import TeamInvitationsView from './components/business/TeamInvitationsView';
import MemberDirectoryView from './components/business/MemberDirectoryView';
import AcceptInvitationView from './components/AcceptInvitationView';
import AISettingsView from './components/business/AISettingsView';
import BusinessSettingsView from './components/business/BusinessSettingsView';
import TeamMemberDashboard from './components/team/TeamMemberDashboard';
import ProfileSettings from './components/settings/ProfileSettings';
import CommunityDirectory from './components/community/CommunityDirectory';
import DonorLeaderboard from './components/community/DonorLeaderboard';
import BadgeLeaderboard from './components/BadgeLeaderboard';
import DirectMessaging from './components/messaging/DirectMessaging';
import TaxDashboard from './components/tax/TaxDashboard';
import SetupWizardView from './components/setup/SetupWizardView';

// Route wrappers for components that need URL params
import {
    ProjectPhotosCaptureRoute,
    CollaborativeEstimateBuilderRoute,
    ActiveProjectViewRoute,
    ClientEstimateViewRoute,
} from './components/routes/RouteWrappers';

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Canvas />,
    },
    {
        path: "/diagnostics",
        element: <DiagnosticsPage />,
    },
    {
        path: "/test-designs",
        element: <TestDesignsPage />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/accept-invitation/:code",
        element: <AcceptInvitationView />,
    },
    {
        path: "/pay/:invoiceId",
        element: <PublicPaymentPage />,
    },
    {
        path: "/business",
        element: (
            <ProtectedRoute>
                <BusinessLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "setup",
                element: <SetupWizardView />,
            },
            {
                path: "dashboard",
                element: <BusinessDashboard />,
            },
            {
                path: "customers",
                element: <CustomersView />,
            },
            {
                path: "projects",
                element: <BusinessProjectsView />,
            },
            {
                path: "projects/:projectId/photos",
                element: <ProjectPhotosCaptureRoute />,
            },
            {
                path: "projects/:projectId/estimate",
                element: <CollaborativeEstimateBuilderRoute />,
            },
            {
                path: "projects/:projectId/active",
                element: <ActiveProjectViewRoute />,
            },
            {
                path: "estimates",
                element: <EstimatesView />,
            },
            {
                path: "estimates/:estimateId/view",
                element: <ClientEstimateViewRoute />,
            },
            {
                path: "invoices",
                element: <InvoicesView />,
            },
            {
                path: "payments",
                element: <PaymentSettingsView />,
            },
            {
                path: "ai-settings",
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <AISettingsView />
                    </ProtectedRoute>
                ),
            },
            {
                path: "settings",
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <BusinessSettingsView />
                    </ProtectedRoute>
                ),
            },
            {
                path: "transactions",
                element: <TransactionsView />,
            },
            {
                path: "schedule",
                element: <ScheduleView />,
            },
            {
                path: "calendar-settings",
                element: <CalendarSettingsView />,
            },
            {
                path: "programs",
                element: <ProgramsBenefitsView />,
            },
            {
                path: "team",
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <TeamView />
                    </ProtectedRoute>
                ),
            },
            {
                path: "team-members",
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <TeamMembersView />
                    </ProtectedRoute>
                ),
            },
            {
                path: "team-invitations",
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <TeamInvitationsView />
                    </ProtectedRoute>
                ),
            },
            {
                path: "member-directory",
                element: (
                    <ProtectedRoute>
                        <MemberDirectoryView />
                    </ProtectedRoute>
                ),
            },
            {
                path: "analytics",
                element: (
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                        <AnalyticsView />
                    </ProtectedRoute>
                ),
            },
            {
                path: "community",
                element: <CommunityDirectory />,
            },
            {
                path: "champions",
                element: <DonorLeaderboard />,
            },
            {
                path: "badges",
                element: <BadgeLeaderboard />,
            },
        ],
    },
    {
        path: "/tax",
        element: (
            <ProtectedRoute>
                <BusinessLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "dashboard",
                element: <TaxDashboard />,
            },
        ],
    },
    {
        path: "/messages",
        element: (
            <ProtectedRoute>
                <DirectMessaging />
            </ProtectedRoute>
        ),
    },
    {
        path: "/messages/:userId",
        element: (
            <ProtectedRoute>
                <DirectMessaging />
            </ProtectedRoute>
        ),
    },
    {
        path: "/team",
        element: (
            <ProtectedRoute>
                <BusinessLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "dashboard",
                element: <TeamMemberDashboard />,
            },
            {
                path: "projects/:projectId/active",
                element: <ActiveProjectViewRoute />,
            },
        ],
    },
    {
        path: "/settings",
        element: (
            <ProtectedRoute>
                <BusinessLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "profile",
                element: <ProfileSettings />,
            },
        ],
    },
]);