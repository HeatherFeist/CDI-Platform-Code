import { useEffect, useRef } from 'react';

interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  message?: string;
}

export const useUnsavedChanges = ({ 
  hasUnsavedChanges, 
  message = "You have unsaved changes. Are you sure you want to leave?" 
}: UseUnsavedChangesProps) => {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Update ref when hasUnsavedChanges changes
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        // This triggers the browser's native dialog
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChangesRef.current) {
        const confirmLeave = window.confirm(message);
        if (!confirmLeave) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [message]);

  // Function to check before programmatic navigation
  const checkUnsavedChanges = (): boolean => {
    if (hasUnsavedChangesRef.current) {
      return window.confirm(message);
    }
    return true;
  };

  return { checkUnsavedChanges };
};