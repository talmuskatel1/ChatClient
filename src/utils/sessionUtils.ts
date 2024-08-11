export const generateSessionId = (): string => {
    return Math.random().toString(36).slice(2, 9);
  };
  
  export const getSessionUserId = (): string | null => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return null;
    
    return localStorage.getItem(`session_${sessionId}`);
  };

  export const setSessionUserId = (userId: string): void => {
    const sessionId = sessionStorage.getItem('sessionId') || generateSessionId();
    sessionStorage.setItem('sessionId', sessionId);
    localStorage.setItem(`session_${sessionId}`, userId);
  };
  
  export const clearSessionData = (): void => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (sessionId) {
      localStorage.removeItem(`session_${sessionId}`);
    }
    sessionStorage.removeItem('sessionId');
  };

  export const setSessionItem = (key: string, value: string): void => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return;
    
    localStorage.setItem(`session_${sessionId}_${key}`, value);
  };
  
  export const removeSessionItem = (key: string): void => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return;
    
    localStorage.removeItem(`session_${sessionId}_${key}`);
  };