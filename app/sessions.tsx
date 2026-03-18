import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import api from '../constants/api'
import { Colors } from '../constants/colors'

interface Session {
  id: number
  name: string
  status: string
  startedAt: string
  location: string | null
  total: number
  found: number
  notFound: number
  misplaced: number
  pending: number
}

interface RawSession {
  id: number
  name: string
  status: string
  startedAt: string
  location: { name?: string } | string | null
}

interface RawItem {
  status: string
}

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [scannerName, setScannerName] = useState('')
  const router = useRouter()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [name, res] = await Promise.all([
        AsyncStorage.getItem('scannerName'),
        api.get('/inventory'),
      ])
      setScannerName(name || '')

      const active: RawSession[] = res.data.filter((s: RawSession) => s.status === 'IN_PROGRESS')

      const detailed = await Promise.all(
        active.map((s: RawSession) =>
          api.get(`/inventory/${s.id}`).then(r => {
            const items: RawItem[] = r.data.items ?? []
            const locationName =
              typeof s.location === 'object' && s.location !== null
                ? s.location.name ?? null
                : (s.location as string | null) ?? null
            return {
              id: s.id,
              name: String(s.name || ''),
              status: s.status,
              startedAt: s.startedAt,
              location: locationName,
              total:     items.length,
              found:     items.filter(i => i.status === 'FOUND').length,
              notFound:  items.filter(i => i.status === 'NOT_FOUND').length,
              misplaced: items.filter(i => i.status === 'MISPLACED').length,
              pending:   items.filter(i => i.status === 'PENDING').length,
            } satisfies Session
          })
        )
      )
      setSessions(detailed)
    } catch {
      Alert.alert('Ошибка', 'Не удалось подключиться к серверу.\nПроверьте WiFi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleLogout = async () => {
    await AsyncStorage.removeItem('scannerName')
    router.replace('/')
  }

  const progress = (s: Session) => {
    const checked = s.found + s.notFound + s.misplaced
    return s.total > 0 ? Math.round(checked / s.total * 100) : 0
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 {scannerName}</Text>
          <Text style={styles.headerSub}>Выберите акт инвентаризации</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={s => String(s.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.accent} />}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Нет активных актов</Text>
            <Text style={styles.emptySub}>Создайте акт на веб-сайте</Text>
          </View>
        ) : null}
        renderItem={({ item: s }) => {
          const prog = progress(s)
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName} numberOfLines={2}>{s.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>В процессе</Text>
                </View>
              </View>

              {s.location ? (
                <Text style={styles.cardLocation}>📍 {s.location}</Text>
              ) : null}

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { flex: prog }]} />
                <View style={{ flex: 100 - prog }} />
              </View>
              <Text style={styles.progressText}>{prog}% · {s.total} ОС</Text>

              <View style={styles.statsRow}>
                <Text style={[styles.stat, { color: Colors.accent2 }]}>✅ {s.found}</Text>
                <Text style={[styles.stat, { color: Colors.danger }]}>❌ {s.notFound}</Text>
                <Text style={[styles.stat, { color: Colors.warn }]}>⚠️ {s.misplaced}</Text>
                <Text style={[styles.stat, { color: Colors.text3 }]}>⏳ {s.pending}</Text>
                <Text style={[styles.stat, { color: Colors.text3, marginLeft: 'auto' }]}>
                  {fmtDate(s.startedAt)}
                </Text>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => router.push({
                    pathname: '/session/[id]',
                    params: { id: s.id, name: s.name }
                  })}
                >
                  <Text style={styles.detailBtnText}>📋 Детали</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scanBtn}
                  onPress={() => router.push({
                    pathname: '/scan',
                    params: { sessionId: s.id, sessionName: s.name }
                  })}
                >
                  <Text style={styles.scanBtnText}>📷 Сканировать</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bg2,
  },
  greeting: { fontSize: 16, fontWeight: '700', color: Colors.text1 },
  headerSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 13, color: Colors.text3 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.text2, fontWeight: '600' },
  emptySub: { fontSize: 13, color: Colors.text3, marginTop: 6 },
  card: {
    backgroundColor: Colors.bg2, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 6, gap: 8,
  },
  cardName: { fontSize: 14, fontWeight: '600', color: Colors.text1, flex: 1 },
  badge: { backgroundColor: '#1e3a5f', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: '#60a5fa', fontWeight: '600' },
  cardLocation: { fontSize: 12, color: Colors.text3, marginBottom: 10 },
  progressBar: {
    height: 4, backgroundColor: Colors.border, borderRadius: 2,
    overflow: 'hidden', marginBottom: 4, flexDirection: 'row',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  progressText: { fontSize: 11, color: Colors.text3, marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  detailBtn: {
    flex: 1, backgroundColor: Colors.bg3, borderRadius: 10,
    padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  detailBtnText: { fontSize: 13, color: Colors.text2, fontWeight: '600' },
  scanBtn: {
    flex: 1, backgroundColor: '#0c4a2a', borderRadius: 10,
    padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#166534',
  },
  scanBtnText: { fontSize: 13, color: Colors.accent2, fontWeight: '600' },
})