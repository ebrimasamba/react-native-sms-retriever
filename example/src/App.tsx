import { Text, View, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useSMSRetriever } from '../../src/index';

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
