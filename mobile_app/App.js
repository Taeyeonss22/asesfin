import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import CarteraScreen from './src/screens/CarteraScreen';
import CobroScreen from './src/screens/CobroScreen';
import CorteScreen from './src/screens/CorteScreen';
import GlobalNotifications from './src/components/GlobalNotifications';
import Toast from 'react-native-toast-message';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0f172a',
      card: '#1e293b',
      text: '#ffffff',
      border: '#334155',
      primary: '#3b82f6',
    },
  };

  return (
    <NavigationContainer theme={customDarkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }}>
        {session && session.user ? (
          <>
            <Stack.Screen name="Cartera" component={CarteraScreen} options={{ title: 'Mi Cartera' }} />
            <Stack.Screen 
          name="Cobro" 
          component={CobroScreen}
          options={{ title: 'Registrar Pago' }}
        />
        <Stack.Screen 
          name="Corte" 
          component={CorteScreen}
          options={{ title: 'Corte de Caja' }}
        />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
      <GlobalNotifications session={session} />
      <Toast />
    </NavigationContainer>
  );
}
