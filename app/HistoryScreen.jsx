import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem('scan_history');
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load scan history');
      }
    };
    fetchHistory();
  }, []);

  const deleteEntry = async (index) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = [...history];
            updated.splice(index, 1);
            setHistory(updated);
            await AsyncStorage.setItem('scan_history', JSON.stringify(updated));
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.item}>
      <Text style={styles.type}>{item.scanType.toUpperCase()}</Text>
      <Text style={styles.content} numberOfLines={2}>
        {item.content}
      </Text>
      <Text
        style={[
          styles.verdict,
          {
            color:
              item.verdict === 'malicious'
                ? '#e74c3c'
                : item.verdict === 'suspicious'
                ? '#f39c12'
                : '#2ecc71',
          },
        ]}
      >
        Result: {item.verdict.toUpperCase()}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => deleteEntry(index)}>
          <Text style={[styles.btn, { color: '#e74c3c' }]}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: './ResultsScreen',
              params: {
                scanType: item.scanType,
                content: item.content,
                scanResult: JSON.stringify({
                  verdict: item.verdict,
                  malicious: item.malicious,
                  suspicious: item.suspicious,
                  harmless: item.harmless,
                  undetected: item.undetected,
                }),
              },
            })
          }
        >
          <Text style={[styles.btn, { color: '#2980b9' }]}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan History</Text>
      {history.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No scans yet.</Text>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', margin: 30 },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
  },
  type: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#34495e' },
  content: { fontSize: 14, color: '#7f8c8d', marginBottom: 6 },
  verdict: { fontWeight: 'bold', fontSize: 15 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { fontWeight: 'bold', fontSize: 16 },
});