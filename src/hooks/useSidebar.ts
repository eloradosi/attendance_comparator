import { useState, useEffect } from "react";

export function useSidebar() {
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('sidebarExpanded');
      return saved === 'true';
    }
    return false;
  });

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
