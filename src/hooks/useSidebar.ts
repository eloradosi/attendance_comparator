import { useState, useEffect } from "react";

export function useSidebar() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    // Initialize from sessionStorage on mount
    const saved = sessionStorage.getItem('sidebarExpanded');
    if (saved !== null) {
      setSidebarExpanded(saved === 'true');
    }
  }, []);

  useEffect(() => {
    // Listen for changes in sessionStorage from other components
    const interval = setInterval(() => {
      const saved = sessionStorage.getItem('sidebarExpanded');
      const current = saved === 'true';
      if (current !== sidebarExpanded) {
        setSidebarExpanded(current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sidebarExpanded]);

  return sidebarExpanded;
}
