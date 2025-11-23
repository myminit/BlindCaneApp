import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingTop: 40,      
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingVertical: 18, // เพิ่มเพื่อรับขนาดตัวอักษรที่ใหญ่ขึ้น
    paddingHorizontal: 6,
    marginTop: 12,       // เลื่อนลงเล็กน้อยจากบน
    marginBottom: 8,
  },
  appName: {
    color: '#fff',
    fontSize: 24, // ขยายขนาดหัวเรื่องเป็น 24 (ปรับเป็น 26/28 ถ้าต้องการใหญ่ขึ้น)
    fontWeight: '700',
  },
  appTag: {
    color: '#bbb',
    fontSize: 16, // เล็กน้อยใหญ่ขึ้นเพื่อให้สัดส่วนดูสมดุล
    marginTop: 2,
  },
  statusRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 28, // เพิ่มช่องว่างระหว่างสถานะกับการ์ดวิธีใช้
  },
  statusBadge: {
    backgroundColor: '#111',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusTextSmall: {
    color: '#fff',
    fontSize: 16,   // เพิ่มขนาดตัวอักษรสถานะ
    fontWeight: '600',
  },
  descriptionCard: {
    width: '100%',
    backgroundColor: '#0f1113', 
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 18,    // เว้นช่องว่างด้านบนให้มากขึ้น
    marginBottom: 12, // ลดช่องว่างเพื่อให้การ์ดอยู่ใกล้ปุ่มมากขึ้น
    borderColor: '#2a2a2a',
    borderWidth: 1,
  },
  descriptionTitle: {
    color: '#FFD700',
    fontSize: 18,   // เพิ่มขนาดหัวข้อวิธีใช้
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#ddd',
    fontSize: 17,
    lineHeight: 20,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 28,    
    paddingHorizontal: 28,
    minHeight: 64,           
    borderRadius: 20,        
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,        
  },
  buttonDefault: {
    backgroundColor: '#1E90FF',
  },
  buttonConnected: {
    backgroundColor: '#32CD32',
  },
  buttonText: {
    fontSize: 20,          
    color: '#000',
    textAlign: 'center',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 16,           
    paddingVertical: 18,
    paddingHorizontal: 22,
    minHeight: 56,          
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryText: {
    color: '#fff',
    fontSize: 20,    // เพิ่มขนาดจาก 17 -> 20
    fontWeight: '700', // เพิ่มน้ำหนักให้เด่นขึ้น
  },
  deviceList: {
    marginTop: 18,
    width: '100%',
  },
  deviceItem: {
    padding: 14,
    backgroundColor: '#0d0d0d',
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#222',
    borderWidth: 1,
  },
  deviceName: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 6,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  mainArea: {
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 8, // ลด padding เพื่อให้ปุ่มหลักอยู่ใกล้การ์ดขึ้น
  },
  hintText: {
    color: '#9aa0a6',
    fontSize: 13,
    marginTop: 4,
  },
});


