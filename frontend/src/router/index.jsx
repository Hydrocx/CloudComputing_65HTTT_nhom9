import { createHashRouter, Navigate } from "react-router-dom";
import App from "../App.jsx";
import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Courses from "../pages/Courses.jsx";
import FileManager from "../pages/FileManager.jsx";
import SignedURL from "../pages/SignedURL.jsx";
import IAM from "../pages/IAM.jsx";
import Versioning from "../pages/Versioning.jsx";

// Zoho pages
import ZohoHub from "../pages/ZohoHub.jsx";
import ZohoMail from "../pages/ZohoMail.jsx";
import ZohoCrmConsult from "../pages/ZohoCrmConsult.jsx";
import ZohoCrmLeads from "../pages/ZohoCrmLeads.jsx";
import ZohoDeskTickets from "../pages/ZohoDeskTickets.jsx";
import ZohoInvoices from "../pages/ZohoInvoices.jsx";
import ZohoSign from "../pages/ZohoSign.jsx";
import ZohoMeeting from "../pages/ZohoMeeting.jsx";
import ZohoAnalytics from "../pages/ZohoAnalytics.jsx";
import ZohoSubscriptions from "../pages/ZohoSubscriptions.jsx";
import ZohoCliq from "../pages/ZohoCliq.jsx";
import ZohoCreator from "../pages/ZohoCreator.jsx";

import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ allow, children }) => {
  const { currentUser, role } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const router = createHashRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "courses", element: <Courses /> },
      { path: "files", element: <FileManager /> },
      { path: "signed-url", element: <SignedURL /> },
      {
        path: "iam",
        element: (
          <ProtectedRoute allow={["Admin"]}>
            <IAM />
          </ProtectedRoute>
        ),
      },
      {
        path: "versioning",
        element: (
          <ProtectedRoute allow={["Admin", "Teacher"]}>
            <Versioning />
          </ProtectedRoute>
        ),
      },

      // === Zoho Routes ===
      { path: "zoho", element: <ZohoHub /> },
      {
        path: "zoho/mail",
        element: (
          <ProtectedRoute allow={["Admin"]}>
            <ZohoMail />
          </ProtectedRoute>
        ),
      },
      { path: "zoho/crm", element: <ZohoCrmConsult /> },
      {
        path: "zoho/crm/leads",
        element: (
          <ProtectedRoute allow={["Admin"]}>
            <ZohoCrmLeads />
          </ProtectedRoute>
        ),
      },
      { path: "zoho/desk", element: <ZohoDeskTickets /> },
      { path: "zoho/invoice", element: <ZohoInvoices /> },
      {
        path: "zoho/sign",
        element: (
          <ProtectedRoute allow={["Admin", "Teacher"]}>
            <ZohoSign />
          </ProtectedRoute>
        ),
      },
      { path: "zoho/meeting", element: <ZohoMeeting /> },
      {
        path: "zoho/analytics",
        element: (
          <ProtectedRoute allow={["Admin"]}>
            <ZohoAnalytics />
          </ProtectedRoute>
        ),
      },
      { path: "zoho/subscription", element: <ZohoSubscriptions /> },
      {
        path: "zoho/cliq",
        element: (
          <ProtectedRoute allow={["Admin"]}>
            <ZohoCliq />
          </ProtectedRoute>
        ),
      },
      {
        path: "zoho/creator",
        element: (
          <ProtectedRoute allow={["Admin"]}>
            <ZohoCreator />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
