import { useEffect, useCallback, useRef, useState } from 'react';
import type { EventSubscription } from 'react-native';
import { Platform } from 'react-native';
import type { SMSError, SMSStatus } from './types';

// Conditional import to prevent crashes on iOS
let NativeSMSRetriever: any = null;

if (Platform.OS === 'android') {
  try {
    const module = require('./NativeSmsRetriever');
    NativeSMSRetriever = module.default;
  } catch (error) {
    console.warn('Failed to load SMS Retriever module:', error);
  }
}

export interface UseSMSRetrieverOptions {
  timeoutMs?: number;
  autoStart?: boolean;
  onSuccess?: (otp: string) => void;
  onError?: (error: SMSError) => void;
}

export interface UseSMSRetrieverReturn {
  // State
  appHash: string;
  smsCode: string;
  isLoading: boolean;
  isListening: boolean;
  error: string | null;
  status: SMSStatus | null;

  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  reset: () => void;

  // Utilities
  isReady: boolean;
  hasError: boolean;
}

/**
 * Custom hook for SMS Retriever functionality
 * Provides a clean, React-friendly interface to the SMS Retriever TurboModule
 */
export const useSMSRetriever = (
  options: UseSMSRetrieverOptions = {}
): UseSMSRetrieverReturn => {
  const { onSuccess, onError } = options;

  // State
  const [appHash, setAppHash] = useState<string>('');
  const [smsCode, setSmsCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SMSStatus | null>(null);

  // Refs for cleanup
  const smsSubscription = useRef<EventSubscription | null>(null);
  const errorSubscription = useRef<EventSubscription | null>(null);
  const isInitialized = useRef<boolean>(false);

  // Platform check - SMS Retriever is Android-only
  const isAndroid = Platform.OS === 'android';

  // Initialize the SMS Retriever
  const initialize = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Check if running on Android and module is available
      if (!isAndroid || !NativeSMSRetriever) {
        setError('SMS Retriever is only supported on Android');
        setIsLoading(false);
        isInitialized.current = true;
        return;
      }

      // Get app hash
      const hash = await NativeSMSRetriever.getAppHash();
      setAppHash(hash);

      // Get initial status
      const currentStatus = await NativeSMSRetriever.getStatus();
      setStatus(currentStatus);
    } catch (initError) {
      console.error('Failed to initialize SMS Retriever:', initError);
      setError(`Initialization failed: ${initError}`);
    } finally {
      setIsLoading(false);
      isInitialized.current = true;
    }
  }, [isAndroid]);

  // Start SMS listening
  const startListening = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setIsListening(true);

      // Check if running on Android and module is available
      if (!isAndroid || !NativeSMSRetriever) return;

      NativeSMSRetriever.startSMSListener();
    } catch (startError) {
      console.error('Failed to start SMS listener:', startError);
      setError(`SMS retrieval failed: ${startError}`);
      setIsListening(false);
      throw startError;
    }
  }, [isAndroid]);

  // Stop SMS listening
  const stopListening = useCallback(() => {
    try {
      // Only call native method on Android if module is available
      if (isAndroid && NativeSMSRetriever) {
        NativeSMSRetriever.stopSMSListener();
      }
      setIsListening(false);
      setError(null);
    } catch (stopError) {
      console.error('Failed to stop SMS listener:', stopError);
      setError(`Failed to stop listener: ${stopError}`);
    }
  }, [isAndroid]);

  // Reset all state
  const reset = useCallback(() => {
    setSmsCode('');
    setError(null);
    setIsListening(false);
    stopListening();
  }, [stopListening]);

  // Setup event listeners
  useEffect(() => {
    if (!isInitialized.current || !isAndroid || !NativeSMSRetriever) return;

    // Listen for successful SMS retrieval
    smsSubscription.current = NativeSMSRetriever.onSMSRetrieved(
      (otp: string) => {
        setSmsCode(otp);
        setIsListening(false);
        setError(null);
        onSuccess?.(otp);
      }
    );

    // Listen for errors
    errorSubscription.current = NativeSMSRetriever.onSMSError(
      (smsError: SMSError) => {
        const errorMessage = `${smsError.type}: ${smsError.message}`;
        setError(errorMessage);
        setIsListening(false);
        onError?.(smsError);
        console.error('SMS Error:', smsError);
      }
    );

    return () => {
      smsSubscription.current?.remove();
      errorSubscription.current?.remove();
    };
  }, [onSuccess, onError, isAndroid]);

  // Initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      stopListening();
    };
  }, [initialize, stopListening]);

  // Auto-start if enabled
  // useEffect(() => {
  //   if (autoStart && isInitialized.current && !isListening && !error) {
  //     startListening().catch(console.error);
  //   }
  // }, [autoStart, isListening, error, startListening]);

  // Computed values
  const isReady = isInitialized.current && !isLoading && !error;
  const hasError = error !== null;

  return {
    // State
    appHash,
    smsCode,
    isLoading,
    isListening,
    error,
    status,

    // Actions
    startListening,
    stopListening,
    reset,

    // Utilities
    isReady,
    hasError,
  };
};

export default useSMSRetriever;

// Export types for external use
export type { SMSError, SMSStatus } from './types';
