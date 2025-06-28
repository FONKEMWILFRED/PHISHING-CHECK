import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';

export default function ResultsScreen() {
  const { scanResult, scanType, content } = useLocalSearchParams();
  const parsedResult = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;

  const getVerdictColor = () => {
    switch (parsedResult.verdict) {
      case 'malicious': return '#e74c3c';
      case 'suspicious': return '#f39c12';
      case 'safe': return '#2ecc71';
      default: return '#7f8c8d';
    }
  };

  const getVerdictIcon = () => {
    switch (parsedResult.verdict) {
      case 'malicious': return 'dangerous';
      case 'suspicious': return 'warning';
      case 'safe': return 'check-circle';
      default: return 'help';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Scan Results</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.scanType}>Scan Type: {scanType?.toUpperCase() || 'N/A'}</Text>

        <View style={styles.contentBox}>
          <Text style={styles.contentLabel}>Scanned Content:</Text>
          <Text style={styles.contentText}>{content || 'N/A'}</Text>
        </View>

        <View style={[styles.verdictContainer, { backgroundColor: getVerdictColor() }]}>
          <Icon name={getVerdictIcon()} size={30} color="#fff" />
          <Text style={styles.verdictText}>{parsedResult.verdict?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={[styles.statBadge, { backgroundColor: '#e74c3c' }]}>
              <Text style={styles.statBadgeText}>Malicious</Text>
              <Text style={styles.statBadgeCount}>{parsedResult.malicious ?? 0}</Text>
            </View>

            <View style={[styles.statBadge, { backgroundColor: '#f39c12' }]}>
              <Text style={styles.statBadgeText}>Suspicious</Text>
              <Text style={styles.statBadgeCount}>{parsedResult.suspicious ?? 0}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={[styles.statBadge, { backgroundColor: '#2ecc71' }]}>
              <Text style={styles.statBadgeText}>Harmless</Text>
              <Text style={styles.statBadgeCount}>{parsedResult.harmless ?? 0}</Text>
            </View>

            <View style={[styles.statBadge, { backgroundColor: '#95a5a6' }]}>
              <Text style={styles.statBadgeText}>Undetected</Text>
              <Text style={styles.statBadgeCount}>{parsedResult.undetected ?? 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: { backgroundColor: '#3498db', padding: 20, alignItems: 'center', marginTop: 35 },
  headerText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  contentContainer: { padding: 20 },
  scanType: { fontSize: 16, color: 'white', marginBottom: 15, textAlign: 'center' },
  contentBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1
  },
  contentLabel: { fontWeight: 'bold', marginBottom: 5, color: '#2c3e50' },
  contentText: { color: '#555' },
  verdictContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  verdictText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
  statsContainer: { marginBottom: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statBadge: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    elevation: 1
  },
  statBadgeText: { color: '#fff', fontWeight: 'bold' },
  statBadgeCount: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
});