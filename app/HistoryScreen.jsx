import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://192.168.0.146:5000/api/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'malicious': return '#e74c3c';
      case 'suspicious': return '#f39c12';
      case 'safe': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => navigation.navigate('Results', { 
        scanResult: { 
          malicious: item.result.malicious,
          suspicious: item.result.suspicious,
          harmless: item.result.harmless,
          undetected: item.result.undetected,
          verdict: item.verdict
        },
        scanType: item.type,
        content: item.content 
      })}
    >
      <View style={styles.itemHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon
            name={
              item.type === 'url' ? 'link' :
              item.type === 'email' ? 'email' :
              'insert-drive-file'
            }
            size={18}
            color="#2c3e50"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.itemType}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(item.verdict) }]}>
          <Text style={styles.verdictBadgeText}>{item.verdict.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.itemContent} numberOfLines={1} ellipsizeMode="tail">
        {item.content}
      </Text>
      <Text style={styles.itemDate}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Scan History</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading history...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="history" size={50} color="#95a5a6" />
          <Text style={styles.emptyText}>No scan history found</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#3498db', padding: 20, alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#95a5a6', fontSize: 18 },
  listContainer: { padding: 15 },
  item: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  itemType: { fontWeight: 'bold', color: '#2c3e50', fontSize: 15 },
  verdictBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  verdictBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  itemContent: { color: '#555', marginBottom: 5 },
  itemDate: { fontSize: 12, color: '#95a5a6' },
});
