import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  header: { marginBottom: 8 },
  appName: { fontSize: 22, fontWeight: '700' },
  appTag: { fontSize: 14, color: 'gray' },

  statusRow: { marginVertical: 8 },
  statusBadge: { backgroundColor: '#EFEFEF', padding: 8, borderRadius: 8 },
  statusTextSmall: { fontSize: 13, color: '#333' },

  descriptionCard: { backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8, marginBottom: 12 },
  descriptionTitle: { fontWeight: '700', marginBottom: 4 },
  descriptionText: { color: '#444' },

  mainArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  button: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  buttonDefault: { backgroundColor: '#4C9AFF' },
  buttonConnected: { backgroundColor: '#4CAF50' },
  buttonText: { color: '#fff', fontWeight: '700' },

  secondaryButton: { padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: '#ddd' },
  secondaryText: { color: '#333' },

  deviceList: { maxHeight: 160, marginBottom: 8 },
  deviceItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  deviceName: { fontWeight: '600' },
  deviceId: { fontSize: 12, color: 'gray' },

  eventsHeader: { marginTop: 8, marginBottom: 4 },
  eventsTitle: { fontWeight: '700' },
  eventsList: { flex: 1 },
  eventItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  eventTitle: { fontWeight: '700' },
  eventText: { color: '#333', marginTop: 4 },

  emptyText: { color: 'gray', padding: 12, textAlign: 'center' }
});
