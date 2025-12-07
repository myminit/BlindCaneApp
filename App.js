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

// -----------------------
// ฟังก์ชันช่วยเหลือ
// -----------------------
const speakText = (msg, selectedVoice) => {
  if (!msg) return;
  try {
    Speech.stop();
    const options = {};
    if (selectedVoice && selectedVoice.identifier) options.voice = selectedVoice.identifier;
    else options.language = 'th-TH';
    Speech.speak(msg, options);
  } catch (e) {
    try { AccessibilityInfo.announceForAccessibility(msg); } catch (err) {}
  }
};

// แปลง JSON event → ข้อความที่จะส่งไป server/LINE
function formatMessageForLine(json) {
  if (!json || json.type !== 'event') {
    return 'ได้รับข้อมูลจากไม้เท้า แต่รูปแบบไม่ถูกต้อง';
  }

  const ev = (json.event || '').toString().toLowerCase();

  if (ev === 'fall') {
    const impact = json.impact_g != null ? json.impact_g : 'ไม่ทราบ';
    const recent = json.fall_recent ? 'ใช่' : 'ไม่ใช่';
    return `⚠️ ตรวจพบการล้ม!\nแรงกระแทก: ${impact} G\nล้มซ้ำภายใน 5 วินาที: ${recent}`;
  }

  if (ev === 'obstacle') {
    const front = json.front_cm != null ? json.front_cm : 'ไม่ทราบ';
    const side = json.side_cm != null ? json.side_cm : 'ไม่ทราบ';
    return `🚧 พบสิ่งกีดขวางด้านหน้า\nด้านหน้า: ${front} cm\nด้านข้าง: ${side} cm`;
  }

  if (ev === 'step') {
    const side = json.side_cm != null ? json.side_cm : 'ไม่ทราบ';
    return `⬆️ พบทางต่างระดับด้านข้าง ${side} cm`;
  }

  return `📢 Event: ${json.event || 'ไม่ทราบ'}`;
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('ยังไม่เชื่อมต่อ');
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setStatus('กำลังขอ permission...');
        const granted = await BluetoothService.requestPermissions();
        setPermissionGranted(granted);

        if (granted) {
          setStatus('พร้อมใช้งาน - กดเพื่อสแกน');
        } else {
          setStatus('⚠️ ไม่ได้รับอนุญาต - ตรวจสอบ Settings');
          try { AccessibilityInfo.announceForAccessibility('กรุณาอนุญาต Bluetooth permission ใน Settings'); } catch (e) {}
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
      speakText(msg, selectedVoice);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedVoice]);

  // ⭐ รับ event JSON จาก Bluetooth + ส่งไป server + ส่งข้อความเพิ่มเติม
  useEffect(() => {
    BluetoothService.setOnMessage(async (jsonObj) => {
      // เพิ่ม event ใน list
      setEvents(prev => [{ id: Date.now().toString(), payload: jsonObj }, ...prev]);

      // แปลงเป็นข้อความสำหรับส่งไป server/LINE
      const messageToSend = formatMessageForLine(jsonObj);

      // ส่งไป server แบบ { message: "..." }
      try {
        await fetch("https://34781ec4-2651-4b6d-9049-8ea6f9c1ba91-00-3jz8slmp2iyx2.pike.replit.dev/iot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageToSend })
        });
        console.log("ส่งไป server แล้ว:", messageToSend);
      } catch (err) {
        console.log("ส่ง event ไป server ไม่สำเร็จ:", err);
      }

      // ส่งข้อความเพิ่มเติม (ถ้าต้อง) - เรียก API /message
      try {
        await fetch("https://34781ec4-2651-4b6d-9049-8ea6f9c1ba91-00-3jz8slmp2iyx2.pike.replit.dev/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: messageToSend,
            event: jsonObj.event,
            timestamp: new Date().toISOString()
          })
        });
        console.log("ส่งข้อความเพิ่มเติมไป /message แล้ว");
      } catch (err) {
        console.log("ส่ง message ไป /message ไม่สำเร็จ:", err);
      }

      // พูดเหตุการณ์ (บนมือถือ) และสั่น
      try {
        if (jsonObj && jsonObj.event) {
          const tmsg = `ได้รับเหตุการณ์ ${jsonObj.event}`;
          speakText(tmsg, selectedVoice);
          try { AccessibilityInfo.announceForAccessibility(tmsg); } catch (e) {}
          Vibration.vibrate(100);
        }
      } catch (e) {
        console.log('onMessage handler error', e);
      }
    });

    BluetoothService.setOnConnectionChange((isConn, deviceName) => {
      setConnected(isConn);
      if (isConn) {
        setStatus(`เชื่อมต่อแล้ว: ${deviceName || 'อุปกรณ์'}`);
      } else {
        setStatus('ยังไม่เชื่อมต่อ');
      }
    });

    return () => {
      BluetoothService.setOnMessage(null);
      BluetoothService.setOnConnectionChange(null);
    };
  }, [selectedVoice]);

  const speak = (msg) => {
    speakText(msg, selectedVoice);
  };

  const announce = (msg) => {
    try {
      if (msg) AccessibilityInfo.announceForAccessibility(msg);
    } catch (e) {}
  };

  const handleScan = async () => {
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
      const msg = found.length
        ? `พบ ${found.length} อุปกรณ์`
        : 'ไม่พบอุปกรณ์ ลองตรวจสอบว่าเปิดบลูทูธหรือยัง';
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
        onPress={() => speak('กดปุ่มกลางเพื่อเชื่อมต่อ. หากไม่พบอุปกรณ์ให้กดสแกน')}
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
                  ? `เชื่อมต่อ ${devices[0].name || 'อุปกรณ์แรก'}`
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

      <View style={styles.eventsHeader}>
        <Text style={styles.eventsTitle}>Events จากไม้เท้า</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const payload = item.payload || {};
          return (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{payload.event || 'unknown'}</Text>
              <Text style={styles.eventText}>{JSON.stringify(payload)}</Text>
            </View>
          );
        }}
        style={styles.eventsList}
        ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีเหตุการณ์</Text>}
      />
    </SafeAreaView>
  );
}