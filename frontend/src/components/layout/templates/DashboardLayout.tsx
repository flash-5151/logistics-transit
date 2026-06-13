import * as React from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../organisms/Sidebar";
import { Navbar } from "../organisms/Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar title={title} />

        {/*
          key={location.pathname} remounts this element on every route
          change, which re-triggers the animate-page-in CSS animation
          and gives a smooth slide-up entrance per page.
        */}
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto p-6 animate-page-in"
        >
          <div className="mx-auto max-w-7xl w-full animate-stagger">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export { DashboardLayout };
