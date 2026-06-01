import { createHashRouter, Navigate } from "react-router-dom";
import App from "../App.jsx";
import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Courses from "../pages/Courses.jsx";
import FileManager from "../pages/FileManager.jsx";
import SignedURL from "../pages/SignedURL.jsx";
import IAM from "../pages/IAM.jsx";
import Versioning from "../pages/Versioning.jsx";
import EmailTest from "../pages/EmailTest.jsx";
import LeadsPage from "../pages/LeadsPage.jsx";
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
      {
        path: "email",
        element: (
          <ProtectedRoute allow={["Admin"]}>
            <EmailTest />
          </ProtectedRoute>
        ),
      },
      {
        path: "leads",
        element: <LeadsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
