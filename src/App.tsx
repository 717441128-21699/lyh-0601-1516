import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ResignationForm from "@/pages/ResignationForm";
import HandoverTasks from "@/pages/HandoverTasks";
import AssetReturn from "@/pages/AssetReturn";
import PermissionClose from "@/pages/PermissionClose";
import Settlement from "@/pages/Settlement";
import Archive from "@/pages/Archive";
import { useStore } from "@/store/useStore";

export default function App() {
  const { initializeData, currentUser } = useStore();

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      initializeData();
    }
  }, [currentUser, initializeData]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resignation-form" element={<ResignationForm />} />
          <Route path="/handover-tasks" element={<HandoverTasks />} />
          <Route path="/asset-return" element={<AssetReturn />} />
          <Route path="/permission-close" element={<PermissionClose />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/archive" element={<Archive />} />
        </Route>
      </Routes>
    </Router>
  );
}
