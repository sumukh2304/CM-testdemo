import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Logo from '../../components/Logo'

export default function NavigationNative() {
  const navigation = useNavigation() as any
  const [q, setQ] = React.useState('')

  const onSearch = () => {
    navigation.navigate('Search', { q })
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Logo iconSize={28} fontSize={16} />
      </View>
      <View style={styles.center}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#8e9196"
          value={q}
          onChangeText={setQ}
          style={styles.search}
          onSubmitEditing={onSearch}
        />
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={onSearch} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { height: 56, backgroundColor: '#0f0f14', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e25' },
  left: { width: 120 },
  center: { flex: 1, paddingHorizontal: 8 },
  right: { width: 100, alignItems: 'flex-end' },
  search: { backgroundColor: '#18181b', color: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#24242a' },
  searchBtn: { backgroundColor: '#CC5500', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  searchBtnText: { color: 'white', fontWeight: '700' },
})
