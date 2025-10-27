import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";

import ManajemenPaket from "./pages/ManajemenPaket";
import DokumenArsip from "./pages/DokumenArsip";
import PengawasanAudit from "./pages/PengawasanAudit";
import BPKP from "./pages/BPKP";
import PUPR from "./pages/PUPR";
import Itwasda from "./pages/Itwasda";
import VendorPenyedia from "./pages/VendorPenyedia";
import KonsultanPerencanaan from "./pages/KonsultanPerencanaan";
import KonsultanPengawas from "./pages/KonsultanPengawas";
import Konstruksi from "./pages/Konstruksi";
import KompetensiPPK from "./pages/KompetensiPPK";
import MonitoringEvaluasi from "./pages/MonitoringEvaluasi";
import LaporanAnalisis from "./pages/LaporanAnalisis";
import PengaturanAkses from "./pages/PengaturanAkses";
import BantuanPanduan from "./pages/BantuanPanduan";
import EditProfile from "./pages/EditProfile";
import AccountSettings from "./pages/AccountSettings";

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  // While we don't know the auth state yet, don't redirect — let the auth check finish
  if (isLoading) return null;
  return isAuthenticated ? children : <Navigate to="/sip-kpbj/signin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route path="/sip-kpbj/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Home />} />

            {/* Sistem Pengawasan Routes */}
            <Route path="manajemen-paket" element={<ManajemenPaket />} />
            <Route path="dokumen-arsip" element={<DokumenArsip />} />
            <Route path="pengawasan-audit" element={<PengawasanAudit />} />
            <Route path="pengawasan-audit/itwasda" element={<Itwasda />} />
            <Route path="pengawasan-audit/bpkp" element={<BPKP />} />
            <Route path="pengawasan-audit/pupr" element={<PUPR />} />
            <Route path="vendor-penyedia" element={<VendorPenyedia />} />
            <Route path="vendor-penyedia/konsultan-perencanaan" element={<KonsultanPerencanaan />} />
            <Route path="vendor-penyedia/konsultan-pengawas" element={<KonsultanPengawas />} />
            <Route path="vendor-penyedia/konstruksi" element={<Konstruksi />} />
            <Route path="kompetensi-ppk" element={<KompetensiPPK />} />
            <Route path="monitoring-evaluasi" element={<MonitoringEvaluasi />} />
            <Route path="laporan-analisis" element={<LaporanAnalisis />} />
            <Route path="pengaturan-akses" element={<PengaturanAkses />} />
            <Route path="bantuan-panduan" element={<BantuanPanduan />} />

            {/* Others Page */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="calendar" element={<Calendar />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/sip-kpbj/signin" element={<SignIn />} />
          <Route path="/sip-kpbj/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
