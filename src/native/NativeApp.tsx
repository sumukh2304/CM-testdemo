import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, ActivityIndicator } from 'react-native'
import { AuthProvider, useAuth } from '../hooks/useAuth'
import LoginNative from './screens/LoginNative'
import DashboardNative from './screens/DashboardNative'
import PlayerNative from './screens/PlayerNative'
import RegisterNative from './screens/RegisterNative'
import SearchNative from './screens/SearchNative'

const Stack = createNativeStackNavigator()

function NativeShell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={{ color: 'white', fontSize: 16, marginTop: 16 }}>Loading...</Text>
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardNative} />
          <Stack.Screen name="Player" component={PlayerNative} />
          <Stack.Screen name="Search" component={SearchNative} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginNative} />
          <Stack.Screen name="Register" component={RegisterNative} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function NativeApp() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <NativeShell />
      </NavigationContainer>
    </AuthProvider>
  )
}
