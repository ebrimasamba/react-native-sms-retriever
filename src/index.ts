import { useEffect, useCallback, useRef, useState } from 'react';
import type { EventSubscription } from 'react-native';
import { NativeModules, Platform, DeviceEventEmitter } from 'react-native';
import type { SMSError, SMSStatus } from './types';

// Lazy load and cache the native module
let NativeSMSRetriever: any = null;
let moduleLoadAttempted = false;

const loadNativeModule = () => {
  if (moduleLoadAttempted) return NativeSMSRetriever;

  moduleLoadAttempted = true;

  if (Platform.OS !== 'android') {
    console.warn('SMS Retriever is only supported on Android');
    return null;
  }

  try {
    const isTurboModuleEnabled = (global as any).__turboModuleProxy != null;
    const module = isTurboModuleEnabled
      ? require('./NativeSmsRetriever').default
      : NativeModules.SMSRetriever;
    NativeSMSRetriever = module;
  } catch (error) {
    console.warn('Failed to load SMS Retriever module:', error);
    NativeSMSRetriever = null;
  }

  return NativeSMSRetriever;
};

export interface UseSMSRetrieverOptions {
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
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Refs for cleanup and tracking
  const smsSubscription = useRef<EventSubscription | null>(null);
  const errorSubscription = useRef<EventSubscription | null>(null);
  const cleanupRef = useRef<boolean>(false);
  const callbacksRef = useRef({ onSuccess, onError });

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  // Platform check
  const isAndroid = Platform.OS === 'android';

  // Start SMS listening
  const startListening = useCallback(async (): Promise<void> => {
    if (cleanupRef.current) return;

    try {
      setError(null);
      setIsListening(true);

      if (!isAndroid) return;

      const module = loadNativeModule();
      if (!module) return;

      await module.startSMSListener();
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
      if (!isAndroid) return;

      const module = loadNativeModule();
      if (module) {
        module.stopSMSListener?.();
      }
      setIsListening(false);
      setError(null);
    } catch (stopError) {
      console.error('Failed to stop SMS listener:', stopError);
      setError(`Failed to stop listener: ${stopError}`);
    }
  }, [isAndroid]);

  // Initialize the SMS Retriever
  const initialize = useCallback(async () => {
    if (cleanupRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      if (!isAndroid) {
        setError('SMS Retriever is only supported on Android');
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      const module = loadNativeModule();
      if (!module) {
        setError('SMS Retriever module not available');
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Get app hash
      const hash = await module.getAppHash();
      setAppHash(hash);

      // Get initial status
      const currentStatus = await module.getStatus?.();
      setStatus(currentStatus);

      setIsInitialized(true);
    } catch (initError) {
      console.error('Failed to initialize SMS Retriever:', initError);
      setError(`Initialization failed: ${initError}`);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
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
    if (!isInitialized || !isAndroid) return;

    const module = loadNativeModule();
    if (!module) return;

    const isTurboModuleEnabled = (global as any).__turboModuleProxy != null;

    const handleSMSRetrieved = (otp: string) => {
      if (cleanupRef.current) return;
      console.log('OTP received:', otp);
      setSmsCode(otp);
      setIsListening(false);
      setError(null);
      callbacksRef.current.onSuccess?.(otp);
    };

    const handleSMSError = (smsError: SMSError) => {
      if (cleanupRef.current) return;
      const errorMessage = `${smsError.type}: ${smsError.message}`;
      setError(errorMessage);
      setIsListening(false);
      callbacksRef.current.onError?.(smsError);
      console.error('SMS Error:', smsError);
    };

    if (isTurboModuleEnabled) {
      // New Architecture
      smsSubscription.current = module.onSMSRetrieved?.(handleSMSRetrieved);
      errorSubscription.current = module.onSMSError?.(handleSMSError);
    } else {
      // Old Architecture
      smsSubscription.current = DeviceEventEmitter.addListener(
        'onSMSRetrieved',
        handleSMSRetrieved
      );
      errorSubscription.current = DeviceEventEmitter.addListener(
        'onSMSError',
        handleSMSError
      );
    }

    return () => {
      smsSubscription.current?.remove?.();
      errorSubscription.current?.remove?.();
    };
  }, [isInitialized, isAndroid]);

  // Initialize on mount
  useEffect(() => {
    cleanupRef.current = false;
    initialize();

    return () => {
      cleanupRef.current = true;
      stopListening();
      smsSubscription.current?.remove?.();
      errorSubscription.current?.remove?.();
    };
  }, [initialize, stopListening]);

  // Auto-start listening when initialized
  useEffect(() => {
    if (isInitialized && !isListening && !error && !cleanupRef.current) {
      startListening().catch(console.error);
    }
  }, [isInitialized, isListening, error, startListening]);

  // Computed values
  const isReady = isInitialized && !isLoading && !error;
  const hasError = error !== null;

  return {
    appHash,
    smsCode,
    isLoading,
    isListening,
    error,
    status,
    startListening,
    stopListening,
    reset,
    isReady,
    hasError,
  };
};

export default useSMSRetriever;
export { NativeSMSRetriever };
export type { SMSError, SMSStatus } from './types';
