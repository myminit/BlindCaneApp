import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
  Vibration,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import BluetoothService from './services/BluetoothService';
import * as Speech from 'expo-speech';
import styles from './styles'; 

export default function App() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('ยังไม่เชื่อมต่อ');
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);

  // เพิ่ม state เก็บ voice ที่เลือกได้
  const [selectedVoice, setSelectedVoice] = useState(null);

  // ดึง voices 
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync?.();
        console.log('available voices', voices);
        if (!mounted) return;
        if (voices && voices.length) {
          // หาเสียงที่มี language เป็น th หรือ th-TH
          const thai = voices.find(v => (v.language || '').toLowerCase().startsWith('th'));
          if (thai) setSelectedVoice(thai);
          else setSelectedVoice(voices[0]);
        }
      } catch (e) {
        console.log('get voices error', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ประกาศต้อนรับและคำแนะนำเมื่อผู้ใช้เข้าแอปครั้งแรก
  useEffect(() => {
    const timer = setTimeout(() => {
      const msg =
        'แอปพิเคชั่นสำหรับเชื่อมต่อไม้เท้าของคุณมีการใช้งานดังนี้'+ '1หากต้องการฟังวิธีใช้งานกดปุ่มแรก'+'2กดปุ่มตรงกลางหน้าจอเพื่อเชื่อมต่อกับไม้เท้าอัจฉริยะของคุณที่เปิดสวิตช์การใช้งานเรียบร้อยแล้ว' +
        '3หากคุณไม่พบอุปกรณ์ของคุณ ให้กดปุ่มที่สองรองลงมาเพื่อสแกนหาอุปกรณ์ของคุณอีกครั้ง' ;
      speak(msg);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const speak = (msg) => {
    if (!msg) return;
    try {
      Speech.stop();
      const options = {};
      if (selectedVoice && selectedVoice.identifier) options.voice = selectedVoice.identifier;
      else options.language = 'th-TH'; // fallback ภาษาไทย
      console.log('Speaking:', msg, options);
      Speech.speak(msg, options);
    } catch (e) {
      try {
        AccessibilityInfo.announceForAccessibility(msg);
      } catch (err) {
        console.log('announce error', err);
      }
      
    }
  };

  const announce = (msg) => {
    speak(msg);
  };

  const handleScan = async () => {
    setScanning(true);
    setStatus('กำลังสแกนอุปกรณ์...');
    announce('กำลังสแกนอุปกรณ์บลูทูธ');
    setDevices([]);
    try {
      const found = await BluetoothService.scanForDevices();
      setDevices(found);
      setStatus(found.length ? `พบ ${found.length} อุปกรณ์` : 'ไม่พบอุปกรณ์');
      announce(found.length ? `พบ ${found.length} อุปกรณ์` : 'ไม่พบอุปกรณ์');
    } catch (e) {
      setStatus('สแกนล้มเหลว');
      announce('การสแกนล้มเหลว');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device) => {
    if (busy) return;
    setBusy(true);
    setStatus('กำลังเชื่อมต่อ...');
    announce('กำลังเชื่อมต่อ');
    try {
      const ok = await BluetoothService.connectToDevice(device?.id);
      if (ok) {
        setConnected(true);
        setStatus(`เชื่อมต่อ: ${device?.name || 'อุปกรณ์'}`);
        Vibration.vibrate(150);
        announce('เชื่อมต่อสำเร็จ');
      } else {
        setStatus('เชื่อมต่อไม่สำเร็จ');
        announce('เชื่อมต่อไม่สำเร็จ');
      }
    } catch (e) {
      setStatus('ข้อผิดพลาดการเชื่อมต่อ');
      announce('ข้อผิดพลาดการเชื่อมต่อ');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (busy) return;
    setBusy(true);
    setStatus('ตัดการเชื่อมต่อ...');
    announce('ตัดการเชื่อมต่อ');
    try {
      await BluetoothService.disconnect();
      setConnected(false);
      setStatus('ยังไม่เชื่อมต่อ');
      Vibration.vibrate([0, 100, 50, 100]);
      announce('ตัดการเชื่อมต่อแล้ว');
    } catch (e) {
      setStatus('ตัดการเชื่อมต่อไม่สำเร็จ');
      announce('ตัดการเชื่อมต่อไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleConnect(item)}
      onPressIn={() => speak(`อุปกรณ์ ${item.name}`)}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.deviceItem}
      accessible
      accessibilityLabel={`อุปกรณ์ ${item.name}`}
      accessibilityHint="แตะเพื่อเชื่อมต่อ"
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  const mainButtonLabel = connected
    ? 'ตัดการเชื่อมต่อ'
    : devices.length
    ? `เชื่อมต่อ ${devices[0].name}`
    : scanning
    ? 'กำลังสแกน...'
    : 'กดเพื่อเชื่อมต่อ/สแกน';

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact header */}
      <View style={styles.header}>
        <Text style={styles.appName}>WhiteCane Connect</Text>
        <Text style={styles.appTag}>เชื่อมต่อไม้เท้าขาวอัจฉริยะ</Text>
      </View>

      {/* Status badge under header */}
      <View style={styles.statusRow} accessible accessibilityLiveRegion="polite">
        <View style={styles.statusBadge}>
          <Text style={styles.statusTextSmall}>{status}</Text>
        </View>
      </View>

      {/* Short description card -> เปลี่ยนเป็นวิธีใช้ด่วนที่แตะได้เพื่อฟังเสียง */}
      <TouchableOpacity
        style={styles.descriptionCard}
        onPress={() =>
          speak(
            'วิธีใช้: 1เปิดสวิตช์ไม้เท้าของคุณ. 2แตะปุ่มตรงกลางหน้าจอเพื่อเชื่อมต่อ. ' +
            '3หากไม่พบอุปกรณ์ของคุณ ให้แตะปุ่มที่สองรองลงมาเพื่อสแกนหา'
          )
        }
        accessible
        accessibilityRole="button"
        accessibilityLabel="วิธีใช้"
        accessibilityHint="แตะเพื่อให้แอปอ่านวิธีใช้เป็นเสียง"
      >
        <Text style={styles.descriptionTitle}>วิธีใช้</Text>
        <Text style={styles.descriptionText}>
          1) เปิดสวิตช์ไม้เท้าของคุณ{'\n'}
          2) แตะปุ่มกลางเพื่อเชื่อมต่อ{'\n'}
          3) ถ้าไม่พบ ให้แตะปุ่มสแกน
        </Text>
        <Text style={styles.hintText}>แตะที่นี่เพื่อฟังคำแนะนำด้วยเสียง</Text>
      </TouchableOpacity>

      {/* กล่องกลางที่จัดปุ่มให้อยู่กลางหน้าจอ */}
      <View style={styles.mainArea}>
        <TouchableOpacity
          onPress={() => (connected ? handleDisconnect() : (devices.length ? handleConnect(devices[0]) : handleScan()))}
          onPressIn={() => speak(mainButtonLabel)}
          style={[styles.button, connected ? styles.buttonConnected : styles.buttonDefault]}
          accessible
          accessibilityLabel={connected ? 'กดเพื่อตัดการเชื่อมต่อ' : 'กดเพื่อเชื่อมต่อหรือสแกนอุปกรณ์'}
          accessibilityHint="จะเชื่อมต่อกับอุปกรณ์ที่พบหรือเริ่มสแกนถ้ายังไม่มีอุปกรณ์"
        >
          {busy ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <Text style={styles.buttonText}>
              {connected ? 'ตัดการเชื่อมต่อ' : devices.length ? `เชื่อมต่อ ${devices[0].name}` : (scanning ? 'กำลังสแกน...' : 'กดเพื่อเชื่อมต่อ/สแกน')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleScan}
          onPressIn={() => speak('สแกนอุปกรณ์อีกครั้ง')}
          style={styles.secondaryButton}
          accessible
          accessibilityLabel="สแกนอุปกรณ์อีกครั้ง"
          accessibilityHint="ค้นหาอุปกรณ์บลูทูธใกล้เคียง"
        >
          <Text style={styles.secondaryText}>{scanning ? 'กำลังสแกน...' : 'สแกนอุปกรณ์อีกครั้ง'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        style={styles.deviceList}
        ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีอุปกรณ์แสดง</Text>}
        accessible
      />
    </SafeAreaView>
  );
}


