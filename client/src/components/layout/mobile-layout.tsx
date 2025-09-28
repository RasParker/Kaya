import { ReactNode } from "react";
import StatusBar from "./status-bar";
import BottomNav from "./bottom-nav";

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export default function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  return (
    <div className="screen-container">
      <StatusBar />
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
