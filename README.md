# @ebrimasamba/react-native-sms-retriever

A React Native library for Android SMS Retriever API with support for both new architecture (TurboModules) and old architecture (Bridge). This library allows you to automatically retrieve SMS messages containing OTP codes without requiring SMS permissions.

[![npm version](https://badge.fury.io/js/%40ebrimasamba%2Freact-native-sms-retriever.svg)](https://badge.fury.io/js/%40ebrimasamba%2Freact-native-sms-retriever)
[![npm downloads](https://img.shields.io/npm/dm/@ebrimasamba/react-native-sms-retriever.svg)](https://www.npmjs.com/package/@ebrimasamba/react-native-sms-retriever)

## Features

- ✅ **Android SMS Retriever API** - Automatically retrieve SMS messages
- ✅ **Backward Compatible** - Supports both new architecture (TurboModules) and old architecture (Bridge)
- ✅ **TypeScript Support** - Full TypeScript definitions included
- ✅ **React Hook** - Easy-to-use `useSMSRetriever` hook with automatic state management
- ✅ **Expo Compatible** - Works with Expo managed workflow and development builds
- ✅ **Android-Only** - Optimized specifically for Android SMS Retriever API
- ✅ **No Permissions Required** - Uses Google Play Services SMS Retriever API
- ✅ **Automatic OTP Extraction** - Smart pattern matching for OTP codes
- ✅ **Error Handling** - Comprehensive error handling with retry logic
- ✅ **Event-Driven** - Real-time SMS detection with event listeners

## Installation

```sh
npm install @ebrimasamba/react-native-sms-retriever
# or
yarn add @ebrimasamba/react-native-sms-retriever
```

### React Native Setup

The library uses autolinking, so no additional setup is required for React Native 0.60+. The library automatically detects and uses the appropriate architecture (new or old) based on your React Native version.

### Expo Setup

This library is compatible with Expo! It works out of the box in:

- **Expo Development Builds** - Full functionality
- **Expo Go** - Limited functionality (requires custom development client for full features)

For Expo projects, simply install the library and it will work automatically:

```sh
npx expo install @ebrimasamba/react-native-sms-retriever
```

## Usage

### Using the Hook (Recommended)

```tsx
import { Text, View, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useSMSRetriever } from '@ebrimasamba/react-native-sms-retriever';

export default function App() {
  const { appHash, smsCode } = useSMSRetriever();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>SMS Retriever</Text>
          <Text style={styles.subtitle}>
            Monitor SMS messages automatically
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.label}>App Hash</Text>
            <Text style={styles.value}>{appHash || 'Loading...'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.label}>SMS Code</Text>
            <Text style={styles.value}>{smsCode || 'No SMS received yet'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  content: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#1e293b',
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
```

### Using the Native Module Directly

```tsx
import { NativeSMSRetriever } from '@ebrimasamba/react-native-sms-retriever';

// Get app hash for SMS message
const appHash = await NativeSMSRetriever.getAppHash();
console.log('App Hash:', appHash);

// Start listening for SMS (fire-and-forget)
NativeSMSRetriever.startSMSListener();

// Stop listening
NativeSMSRetriever.stopSMSListener();

// Get current status
const status = await NativeSMSRetriever.getStatus();
console.log('Status:', status);

// Listen for events
const smsSubscription = NativeSMSRetriever.onSMSRetrieved((otp) => {
  console.log('OTP received via event:', otp);
});

const errorSubscription = NativeSMSRetriever.onSMSError((error) => {
  console.error('SMS Error:', error);
});

// Clean up
smsSubscription.remove();
errorSubscription.remove();
```

## SMS Message Format

To use the SMS Retriever API, your SMS message must:

1. **Contain the app hash** at the end of the message
2. **Be sent from a phone number** (not an email or other service)

Example SMS format:

```
Your OTP is 123456 FA+9qCX9VSu
```

Where `FA+9qCX9VSu` is your app hash (obtained from `getAppHash()`).

## API Reference

### useSMSRetriever Hook

#### Options

- `onSuccess?: (otp: string) => void` - Success callback when OTP is received
- `onError?: (error: SMSError) => void` - Error callback when SMS retrieval fails

#### Return Value

**State Properties:**

- `appHash: string` - Your app's hash for SMS messages
- `smsCode: string` - The extracted OTP code
- `isLoading: boolean` - Whether the module is initializing
- `isListening: boolean` - Whether currently listening for SMS
- `error: string | null` - Current error message
- `status: SMSStatus | null` - Current status object

**Action Methods:**

- `startListening: () => Promise<void>` - Start listening for SMS
- `stopListening: () => void` - Stop listening for SMS
- `reset: () => void` - Reset all state and stop listening

**Utility Properties:**

- `isReady: boolean` - Whether the module is ready to use
- `hasError: boolean` - Whether there's an error

### Native Module Methods

- `getAppHash(): Promise<string>` - Get the app hash for SMS messages
- `startSMSListener(): void` - Start listening for SMS (fire-and-forget)
- `stopSMSListener(): void` - Stop listening for SMS
- `getStatus(): Promise<SMSStatus>` - Get current status information
- `onSMSRetrieved: EventEmitter<string>` - Listen for successful SMS retrieval
- `onSMSError: EventEmitter<SMSError>` - Listen for SMS retrieval errors

### Types

#### SMSError

```typescript
interface SMSError {
  type:
    | 'TIMEOUT'
    | 'PERMISSION_DENIED'
    | 'SERVICE_UNAVAILABLE'
    | 'INVALID_SMS_FORMAT'
    | 'UNKNOWN_ERROR';
  message: string;
  retryCount: number;
}
```

#### SMSStatus

```typescript
interface SMSStatus {
  isListening: boolean;
  isRegistered: boolean;
  retryCount: number;
}
```

## Platform Support

- ✅ **Android** - Full SMS Retriever API support
- ❌ **iOS** - Not supported (SMS Retriever API is Android-only)

## Requirements

- React Native 0.60+ (supports both new architecture with TurboModules and old architecture with Bridge)
- Android API level 19+ (Android 4.4+)
- Google Play Services (for SMS Retriever API)
- Expo SDK 48+ (for Expo compatibility)

## Troubleshooting

### Common Issues

1. **SMS not detected**: Ensure your SMS contains the app hash at the end
2. **Timeout errors**: Increase the timeout or check if Google Play Services is available
3. **Permission errors**: SMS Retriever API doesn't require SMS permissions
4. **Build errors**: Make sure you're using React Native 0.60+ with autolinking

### Debug Tips

- Use `getAppHash()` to get the correct hash for your app
- Check the console logs for detailed error messages
- Ensure your app is signed with the correct keystore
- Test with the debug keystore first before using release keystore

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

## Author

**Ebrima Samba**

🔍 Currently seeking remote employment opportunities

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/ebrima-samba-4923a7169/)

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
