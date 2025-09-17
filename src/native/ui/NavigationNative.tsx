import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Logo from '../../components/Logo'
import { contentAPI, type Content } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

export default function NavigationNative() {
  const navigation = useNavigation() as any
  const { logout } = useAuth()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [results, setResults] = React.useState<Content[]>([])
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  const onSearch = () => {
    if (!q.trim()) return
    navigation.navigate('Search', { q })
  }

  // Debounced search
  React.useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        if (!q.trim()) { setResults([]); return }
        const res = await contentAPI.getContent({ q: q.trim(), limit: 10 })
        setResults(res.content || [])
      } catch { setResults([]) }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, open])

  return (
    <View>
      {/* Top bar */}
      <View style={styles.wrap}>
        <View style={styles.left}>
          <TouchableOpacity onPress={() => setMenuOpen(v => !v)} style={styles.iconBtnGhost}>
            <Ionicons name={menuOpen ? 'close' : 'menu'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Logo iconSize={32} fontSize={18} />
        </View>
        <View style={styles.right}>
          <TouchableOpacity onPress={() => setOpen(v => !v)} style={styles.iconBtn}>
            <Ionicons name={open ? 'close' : 'search'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline search input + results */}
      {open && (
        <View style={styles.searchPanel}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#8e9196" style={{ marginLeft: 10 }} />
            <TextInput
              autoFocus
              placeholder="Search movies, shows"
              placeholderTextColor="#8e9196"
              value={q}
              onChangeText={setQ}
              style={styles.search}
              onSubmitEditing={onSearch}
              returnKeyType="search"
            />
            {q?.length > 0 && (
              <TouchableOpacity onPress={() => setQ('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#8e9196" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            )}
          </View>

          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(i) => i.contentId}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => navigation.navigate('Player', { contentId: item.contentId, title: item.title })}>
                  <Text numberOfLines={1} style={styles.resultTitle}>{item.title}</Text>
                  <Text numberOfLines={1} style={styles.resultMeta}>{(item.type || '').toUpperCase()} • {item.genre || ''}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Left hamburger menu panel */}
      {menuOpen && (
        <View style={styles.menuPanel}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); navigation.navigate('Dashboard') }}>
            <Ionicons name="person-circle-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { height: 56, backgroundColor: '#0f0f14', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e25', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  left: { width: 120, alignItems: 'flex-start' },
  center: { flex: 1, paddingHorizontal: 8, alignItems: 'center' },
  right: { width: 100, alignItems: 'flex-end' },
  // brand text removed in favor of graphic Logo
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 999, borderWidth: 1, borderColor: '#24242a' },
  search: { flex: 1, color: 'white', paddingHorizontal: 10, paddingVertical: 8 },
  iconBtn: { backgroundColor: '#CC5500', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconBtnGhost: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: '#24242a' },
  leftRow: { flexDirection: 'row', alignItems: 'center' },
  searchPanel: { backgroundColor: '#0f0f14', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e25' },
  menuPanel: { backgroundColor: '#0f0f14', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e25' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  menuText: { color: 'white', fontWeight: '700' },
  resultItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e25' },
  resultTitle: { color: 'white', fontWeight: '700' },
  resultMeta: { color: '#9aa0a6', fontSize: 12, marginTop: 2 },
})
