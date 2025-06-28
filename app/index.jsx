import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { VIRUSTOTAL_API_KEY } from '../config';

export default function ScanScreen() {
  const [activeTab, setActiveTab] = useState(null);
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Save scan result to AsyncStorage history
  const saveToHistory = async (item) => {
    try {
      const existing = await AsyncStorage.getItem('scan_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(item); // Add new scan at start
      await AsyncStorage.setItem('scan_history', JSON.stringify(history));
    } catch (err) {
      console.warn('Failed to save scan history:', err);
    }
  };

  const handleScan = async () => {
    if (!activeTab) {
      Alert.alert('Error', 'Select a scan type first');
      return;
    }

    setLoading(true);
    try {
      let response;
      const formData = new FormData();

      if (activeTab === 'url') {
        if (!url.trim()) throw new Error('Enter a URL');
        const form = new URLSearchParams();
        form.append('url', url.trim());

        response = await axios.post('https://www.virustotal.com/api/v3/urls', form.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-apikey': VIRUSTOTAL_API_KEY,
          },
        });
      } else if (activeTab === 'email') {
        if (!email.trim()) throw new Error('Enter email content');
        const path = FileSystem.cacheDirectory + 'email.txt';
        await FileSystem.writeAsStringAsync(path, email, { encoding: FileSystem.EncodingType.UTF8 });

        formData.append('file', {
          uri: path,
          type: 'text/plain',
          name: 'email.txt',
        });

        response = await axios.post('https://www.virustotal.com/api/v3/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-apikey': VIRUSTOTAL_API_KEY,
          },
        });
      } else if (activeTab === 'file') {
        if (!file) throw new Error('Select a file');
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
        });

        response = await axios.post('https://www.virustotal.com/api/v3/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-apikey': VIRUSTOTAL_API_KEY,
          },
        });
      }

      const stats = response.data.data?.attributes?.last_analysis_stats || {};
      let verdict = 'safe';
      if (stats.malicious > 0) verdict = 'malicious';
      else if (stats.suspicious > 0) verdict = 'suspicious';

      const resultObject = {
        verdict,
        malicious: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
        undetected: stats.undetected || 0,
      };

      await saveToHistory({
        scanType: activeTab,
        content: activeTab === 'url' ? url : activeTab === 'email' ? email : file.name,
        ...resultObject,
      });

      router.push({
        pathname: '/ResultsScreen',
        params: {
          scanType: activeTab,
          content: activeTab === 'url' ? url : activeTab === 'email' ? email : file.name,
          scanResult: JSON.stringify(resultObject),
        },
      });
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.error?.message || error.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result?.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginTop: 50 }}>
        <Icon name="security" size={64} color="#3498db" />
      <Text style={styles.title}>PHISHGUARD</Text>
      </View>

      <View style={styles.tabContainer}>
        {['url', 'email', 'file'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => {
              setActiveTab(tab);
              setUrl('');
              setEmail('');
              setFile(null);
            }}
          >
            <Icon
              name={tab === 'url' ? 'link' : tab === 'email' ? 'email' : 'insert-drive-file'}
              size={24}
              color={activeTab === tab ? '#fff' : '#555'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'url' && (
        <TextInput
          style={styles.input}
          placeholder="Enter URL"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
      )}

      {activeTab === 'email' && (
        <TextInput
          style={[styles.input, { height: 120 }]}
          placeholder="Paste email content"
          value={email}
          onChangeText={setEmail}
          multiline
          textAlignVertical="top"
        />
      )}

      {activeTab === 'file' && (
        <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
          <Icon name="cloud-upload" size={32} color="#555" />
          <Text style={styles.fileButtonText}>{file ? file.name : 'Select file to scan'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.scanButton, loading && styles.scanButtonDisabled]}
        onPress={handleScan}
        disabled={loading}
      >
        <Text style={styles.scanButtonText}>{loading ? 'Scanning...' : 'Scan Now'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/HistoryScreen')}>
        <Text style={styles.historyButtonText}>Scan History</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'black' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginTop: 10 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50, paddingHorizontal: 20, marginTop: 30 },
  tab: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 10, backgroundColor: '#ecf0f1', marginHorizontal: 5 },
  activeTab: { backgroundColor: '#3498db' },
  tabText: { marginTop: 5, color: '#555', fontWeight: '500' },
  activeTabText: { color: '#fff' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
  fileButton: { backgroundColor: '#fff', borderRadius: 10, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
  fileButtonText: { marginTop: 10, color: '#555' },
  scanButton: { backgroundColor: '#2ecc71', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 15 },
  scanButtonDisabled: { backgroundColor: '#95a5a6' },
  scanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  historyButton: { backgroundColor: '#e74c3c', borderRadius: 10, padding: 15, alignItems: 'center' },
  historyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});