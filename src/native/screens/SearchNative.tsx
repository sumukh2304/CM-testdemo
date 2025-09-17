import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { contentAPI, Content } from '../../services/api'
import NavigationNative from '../ui/NavigationNative'
import ContentRowNative from '../ui/ContentRowNative'
import FooterNative from '../ui/FooterNative'

export default function SearchNative() {
  const route = useRoute() as any
  const navigation = useNavigation() as any
  const initialQ = (route.params?.q || '').toString()
  const [q, setQ] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Content[]>([])

  const runSearch = async (query: string) => {
    try {
      setLoading(true)
      const res = await contentAPI.getContent({ q: query })
      setResults(res.content || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQ) runSearch(initialQ)
  }, [initialQ])

  const onSubmit = () => {
    runSearch(q)
  }

  const onPlay = (contentId: string) => {
    const item = results.find(r => r.contentId === contentId)
    navigation.navigate('Player', { contentId, title: item?.title })
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f14' }}>
      <NavigationNative />
      <View style={styles.searchBarWrap}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#8e9196"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={onSubmit}
          style={styles.search}
        />
      </View>
      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator color="#CC5500" />
          <Text style={styles.centerText}>Searching...</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={{ paddingVertical: 12 }}>
            <ContentRowNative
              title={results.length > 0 ? 'Search Results' : 'No results'}
              items={results}
              onPlay={onPlay}
            />
          </View>
          <FooterNative />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  searchBarWrap: { paddingHorizontal: 12, paddingTop: 8 },
  search: { backgroundColor: '#18181b', color: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#24242a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { color: 'white', marginTop: 10 },
})
