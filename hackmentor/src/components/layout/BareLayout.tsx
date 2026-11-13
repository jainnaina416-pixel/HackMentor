import React from "react";
import { Outlet } from "react-router-dom";

interface BareLayoutProps {
  children?: React.ReactNode;
}

export function BareLayout({ children }: BareLayoutProps) {
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-x-hidden">
      {children || <Outlet />}
    </div>
  );
}

export default BareLayout;
