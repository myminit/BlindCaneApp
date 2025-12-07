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
  Platform
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
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // ✅ เรียกขอ permission ทันทีเมื่อแอปเปิด
  useEffect(() => {
    (async () => {
      try {
        console.log('🔵 App started - requesting Bluetooth permissions...');
        const granted = await BluetoothService.requestPermissions();
        setPermissionGranted(granted);
        
        if (granted) {
          console.log('✅ Bluetooth permissions granted');
          setStatus('พร้อมใช้งาน - กดเพื่อสแกน');
        } else {
          console.log('❌ Bluetooth permissions denied');
          setStatus('⚠️ ไม่ได้รับอนุญาต - ตรวจสอบ Settings');
          announce('กรุณาอนุญาต Bluetooth permission ใน Settings');
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        setStatus('❌ ข้อผิดพลาด: ตรวจสอบ permission');
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync?.();
        if (!mounted) return;
        if (voices && voices.length) {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      const msg =
        'แอปพลิเคชันสำหรับเชื่อมต่อไม้เท้าของคุณ. ' +
        '1. หากต้องการฟังวิธีใช้งานกดปุ่มแรก ' +
        '2. กดปุ่มตรงกลางหน้าจอเพื่อเชื่อมต่อ ' +
        '3. หากไม่พบอุปกรณ์ ให้กดปุ่มที่สองเพื่อสแกน';
      speak(msg);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const speak = (msg) => {
    if (!msg) return;
    try {
      Speech.stop();
      const options = {};
      if (selectedVoice && selectedVoice.identifier) options.voice = selectedVoice.identifier;
      else options.language = 'th-TH';
      Speech.speak(msg, options);
    } catch (e) {
      try {
        AccessibilityInfo.announceForAccessibility(msg);
      } catch (err) {}
    }
  };

  const announce = (msg) => {
    try {
      if (msg) {
        AccessibilityInfo.announceForAccessibility(msg);
      }
    } catch (e) {
      console.log('Announce error:', e);
    }
  };

  const handleScan = async () => {
    // ✅ ตรวจสอบ permission ก่อนสแกน
    if (!permissionGranted) {
      setStatus('⚠️ ไม่ได้รับอนุญาต - ตรวจสอบ Settings');
      announce('กรุณาให้ Bluetooth permission ใน Settings');
      return;
    }

    if (scanning) return;
    setScanning(true);
    setStatus('กำลังสแกนอุปกรณ์...');
    announce('กำลังสแกนอุปกรณ์บลูทูธ');
    setDevices([]);
    
    try {
      const found = await BluetoothService.scanForDevices();
      setDevices(found);
      const msg = found.length ? `พบ ${found.length} อุปกรณ์` : 'ไม่พบอุปกรณ์ ลองตรวจสอบว่าเปิดบลูทูธและ GPS หรือยัง';
      setStatus(msg);
      announce(msg);
    } catch (e) {
      console.error('Scan error:', e);
      setStatus('❌ สแกนล้มเหลว');
      announce('การสแกนล้มเหลว');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device) => {
    // ฟังก์ชั่นนี้ใช้สำหรับเชื่อมต่อกับอุปกรณ์บลูทูธที่เลือก
    // ขั้นตอน:
    // 1. ตั้งค่า busy = true (ป้องกันการคลิกซ้ำ)
    // 2. เรียก BluetoothService.connectToDevice(device.id) เพื่อเชื่อมต่อ
    // 3. ถ้าเชื่อมต่อสำเร็จ ตั้งค่า connected = true
    // 4. ส่งสัญญาณการสั่น (Vibration) เพื่อแจ้งผู้ใช้
    // 5. ตั้งค่า busy = false เมื่อเสร็จ
    if (busy) return;
    setBusy(true);
    setStatus(`กำลังเชื่อมต่อ ${device.name}...`);
    announce('กำลังเชื่อมต่อ');
    
    try {
      const ok = await BluetoothService.connectToDevice(device.id);
      if (ok) {
        setConnected(true);
        setStatus(`เชื่อมต่อแล้ว: ${device.name}`);
        Vibration.vibrate(200);
        announce('เชื่อมต่อสำเร็จแล้ว');
      } else {
        setStatus('เชื่อมต่อไม่สำเร็จ');
        announce('เชื่อมต่อไม่สำเร็จ');
      }
    } catch (e) {
      setStatus('ข้อผิดพลาดการเชื่อมต่อ');
      announce('เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    // ฟังก์ชั่นนี้ใช้สำหรับตัดการเชื่อมต่อบลูทูธ
    // ขั้นตอน:
    // 1. ตั้งค่า busy = true
    // 2. เรียก BluetoothService.disconnect() เพื่อตัดการเชื่อมต่อ
    // 3. ตั้งค่า connected = false
    // 4. ส่งสัญญาณการสั่นแบบลำดับ (pulse) เพื่อแจ้งผู้ใช้
    // 5. ตั้งค่า busy = false เมื่อเสร็จ
    if (busy) return;
    setBusy(true);
    setStatus('กำลังตัดการเชื่อมต่อ...');
    announce('กำลังตัดการเชื่อมต่อ');
    
    try {
      await BluetoothService.disconnect();
      setConnected(false);
      setStatus('ยังไม่เชื่อมต่อ');
      Vibration.vibrate([0, 100, 50, 100]);
      announce('ตัดการเชื่อมต่อแล้ว');
    } catch (e) {
      setStatus('ตัดการเชื่อมต่อไม่สำเร็จ');
      announce('ล้มเหลว');
    } finally {
      setBusy(false);
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleConnect(item)}
      onPressIn={() => speak(`อุปกรณ์ ${item.name || 'ไม่มีชื่อ'}`)}
      style={styles.deviceItem}
      accessible
      accessibilityLabel={`อุปกรณ์ ${item.name || 'ไม่มีชื่อ'} ระดับสัญญาณ ${item.rssi}`}
      accessibilityHint="แตะสองครั้งเพื่อเชื่อมต่อ"
    >
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
      <Text style={styles.deviceId}>ID: {item.id}</Text>
      <Text style={{ fontSize: 12, color: 'gray' }}>Signal: {item.rssi}</Text>
    </TouchableOpacity>
  );

  // Logic for the main button action
  const mainButtonLabel = connected
    ? 'ตัดการเชื่อมต่อ'
    : (devices.length > 0
      ? `เชื่อมต่อ ${devices[0].name || 'อุปกรณ์แรก'}`
      : (scanning ? 'กำลังสแกน...' : 'กดเพื่อเริ่มสแกน'));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>WhiteCane Connect</Text>
        <Text style={styles.appTag}>เชื่อมต่อไม้เท้าขาวอัจฉริยะ</Text>
      </View>

      <View style={styles.statusRow} accessible accessibilityLiveRegion="polite">
        <View style={styles.statusBadge}>
          <Text style={styles.statusTextSmall}>{status}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.descriptionCard}
        accessible
        accessibilityRole="button"
        accessibilityLabel="ฟังวิธีใช้งาน"
      >
        <Text style={styles.descriptionTitle}>วิธีใช้</Text>
        <Text style={styles.descriptionText}>
          1) เปิดสวิตช์ไม้เท้า{'\n'}
          2) กดปุ่มกลางเพื่อสแกน/เชื่อมต่อ{'\n'}
          3) เลือกอุปกรณ์จากรายการด้านล่าง
        </Text>
      </TouchableOpacity>

      <View style={styles.mainArea}>
        <TouchableOpacity
          onPress={() => {
            if (connected) handleDisconnect();
            else if (devices.length > 0) handleConnect(devices[0]);
            else handleScan();
          }}
          style={[styles.button, connected ? styles.buttonConnected : styles.buttonDefault]}
          accessible
          accessibilityLabel={connected ? 'ตัดการเชื่อมต่อ' : 'เชื่อมต่อหรือสแกน'}
        >
          {busy ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <Text style={styles.buttonText}>
              {connected 
                ? 'ตัดการเชื่อมต่อ' 
                : devices.length > 0 
                  ? `เชื่อมต่อ ${devices[0].name}`
                  : scanning 
                    ? 'กำลังสแกน...'
                    : 'กดเพื่อเชื่อมต่อ/สแกน'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleScan}
          style={styles.secondaryButton}
          accessible
          accessibilityLabel="สแกนอุปกรณ์อีกครั้ง"
        >
          <Text style={styles.secondaryText}>{scanning ? 'กำลังค้นหา...' : 'สแกนอีกครั้ง'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        style={styles.deviceList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {scanning ? 'กำลังค้นหา...' : 'กดปุ่มสแกนเพื่อเริ่มค้นหา'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}