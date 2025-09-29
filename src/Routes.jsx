import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import AdminDashboard from "./pages/admin-dashboard";
import ApiClientManagement from "./pages/api-client-management";
import ClinicalDiagnosisEntry from "./pages/clinical-diagnosis-entry";
import DeveloperPortal from "./pages/developer-portal";
import LoginAuthentication from "./pages/login-authentication";
import TerminologyUpload from "./pages/terminology-upload";
import NotFound from "./pages/NotFound";

const AppRoutes = () => (
	<BrowserRouter>
		<AuthProvider>
			<ErrorBoundary>
				<ScrollToTop />
				<Routes>
					<Route index element={<Navigate to="/login-authentication" replace />} />
					<Route path="/login-authentication" element={<LoginAuthentication />} />
					<Route path="/admin-dashboard" element={<AdminDashboard />} />
					<Route path="/api-client-management" element={<ApiClientManagement />} />
					<Route path="/clinical-diagnosis-entry" element={
						<ProtectedRoute>
							<ClinicalDiagnosisEntry />
						</ProtectedRoute>
					} />
					<Route path="/developer-portal" element={<DeveloperPortal />} />
					<Route path="/terminology-upload" element={<TerminologyUpload />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</ErrorBoundary>
		</AuthProvider>
	</BrowserRouter>
);

export default AppRoutes;
