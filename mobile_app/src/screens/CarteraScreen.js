import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LogOut, RefreshCw, Wifi, WifiOff, FileText } from 'lucide-react-native';
import { SyncService } from '../lib/syncService';
import * as Network from 'expo-network';

export default function CarteraScreen() {
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const checkNetworkAndSync = async () => {
    const networkState = await Network.getNetworkStateAsync();
    const offline = !(networkState.isConnected && networkState.isInternetReachable !== false);
    setIsOffline(offline);
    
    if (!offline) {
      const result = await SyncService.syncPending();
      if (result.synced > 0) {
        // Optional: show a small toast or just let it refresh silently
        console.log(`Synced ${result.synced} payments`);
      }
    }
    
    const queue = await SyncService.getQueue();
    setPendingCount(queue.length);
  };

  const fetchCartera = async () => {
    try {
      await checkNetworkAndSync();
      
      const { data, error } = await supabase
        .from('vista_saldos_creditos')
        .select('*')
        .eq('estado', 'ACTIVO')
        .order('fecha_inicio', { ascending: false });

      if (error) {
        console.error('Error fetching cartera:', error);
      } else {
        setCreditos(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCartera();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCartera();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isOffline ? (
            <WifiOff size={20} color="#ef4444" style={{ marginRight: 15 }} />
          ) : pendingCount > 0 ? (
            <Text style={{ color: '#f59e0b', marginRight: 15, fontWeight: 'bold' }}>{pendingCount} ⌛</Text>
          ) : (
            <Wifi size={20} color="#10b981" style={{ marginRight: 15 }} />
          )}
          <TouchableOpacity onPress={handleSignOut} style={{ padding: 10 }}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isOffline, pendingCount]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Cobro', { credito: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>
          {item.nombre_cliente || `Grupo: ${item.credito_id.substring(0, 8)}`}
        </Text>
        <Text style={styles.badge}>{item.tipo}</Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.col}>
          <Text style={styles.label}>Total a Pagar</Text>
          <Text style={styles.value}>${item.total_a_pagar?.toLocaleString()}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Pagado</Text>
          <Text style={[styles.value, {color: '#10b981'}]}>${item.total_pagado?.toLocaleString()}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Saldo</Text>
          <Text style={[styles.value, {color: '#ef4444'}]}>${item.saldo_pendiente?.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredCreditos = creditos.filter(c => {
    const query = searchQuery.toLowerCase();
    const name = c.nombre_cliente ? c.nombre_cliente.toLowerCase() : '';
    const id = c.credito_id ? c.credito_id.toLowerCase() : '';
    return name.includes(query) || id.includes(query);
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o folio..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {loading && !refreshing ? (
        <View style={styles.center}>
          <RefreshCw size={32} color="#3b82f6" style={styles.spinner} />
          <Text style={{color: '#94a3b8', marginTop: 10}}>Cargando cartera...</Text>
        </View>
      ) : creditos.length === 0 ? (
        <View style={styles.center}>
          <Text style={{color: '#94a3b8'}}>No tienes créditos activos en tu zona.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCreditos}
          keyExtractor={(item) => item.credito_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text style={{color: '#94a3b8'}}>No se encontraron créditos que coincidan.</Text>
            </View>
          }
        />
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.corteButton}
          onPress={() => navigation.navigate('Corte')}
        >
          <FileText size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.corteButtonText}>Corte de Caja</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  clientName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#60a5fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  corteButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
