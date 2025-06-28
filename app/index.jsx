import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker'; // ✅ Correct import for Expo
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function ScanScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(null);
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        form.append('url', url);
        console.log("fetching...");
        response = await axios.post('https://www.virustotal.com/api/v3/urls', {
          form,
          headers: {
            "Content-Type": "application/json",
            "x-apikey": process.env.API_VIRUS_TOTAL_KEY
          }
        });
      } else if (activeTab === 'email') {
        if (!email.trim()) throw new Error('Enter email content');
        response = await axios.post('http://192.168.94.35:5000/api/scan/email', { email });
      } else if (activeTab === 'file') {
        if (!file) throw new Error('Select a file');
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
        });
        response = await axios.post('http://192.168.94.35:5000/api/scan/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      console.log("response: ", response);
      navigation.navigate('Results', {
        scanResult: response.data,
        scanType: activeTab,
        content: activeTab === 'url' ? url : activeTab === 'email' ? email : file.name,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });

      if (result?.assets && result.assets.length > 0) {
        setFile(result.assets[0]); // ✅ Expo v50+ uses result.assets
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PhishGuard</Text>
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
              name={
                tab === 'url' ? 'link' :
                  tab === 'email' ? 'email' : 'insert-drive-file'
              }
              size={24}
              color={activeTab === tab ? '#fff' : '#555'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
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
          <Text style={styles.fileButtonText}>
            {file ? file.name : 'Select file to scan'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.scanButton, loading && styles.scanButtonDisabled]}
        onPress={handleScan}
        disabled={loading}
      >
        <Text style={styles.scanButtonText}>{loading ? 'Scanning...' : 'Scan Now'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => router.push('./HistoryScreen')}
      >
        <Text style={styles.historyButtonText}>View Scan History</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginTop: 20 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
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