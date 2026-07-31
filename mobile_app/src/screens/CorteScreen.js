import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';
import { PrintService } from '../lib/printService';
import { Calculator, Save, Printer, ArrowLeft } from 'lucide-react-native';
import * as Network from 'expo-network';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function CorteScreen() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totales, setTotales] = useState({ abonos: 0, ahorros: 0, mora: 0, granTotal: 0 });
  const navigation = useNavigation();

  const fetchPagosSinCorte = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          creditos (nombre_cliente, tipo)
        `)
        .eq('registrado_por', userId)
        .is('corte_id', null)
        .order('fecha_pago', { ascending: true });

      if (error) throw error;
      
      let tabonos = 0;
      let tahorros = 0;
      let tmora = 0;

      if (data) {
        data.forEach(p => {
          if (p.tipo === 'ABONO') tabonos += Number(p.monto);
          if (p.tipo === 'AHORRO') tahorros += Number(p.monto);
          if (p.tipo === 'MORA') tmora += Number(p.monto);
        });
        setPagos(data);
      }

      setTotales({
        abonos: tabonos,
        ahorros: tahorros,
        mora: tmora,
        granTotal: tabonos + tahorros + tmora
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar los pagos pendientes de corte.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPagosSinCorte();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPagosSinCorte();
  };

  const handleCerrarCorte = async () => {
    if (pagos.length === 0) {
      Alert.alert('Sin Movimientos', 'No hay pagos pendientes para cerrar el corte.');
      return;
    }

    Alert.alert(
      'Confirmar Corte',
      `¿Estás seguro que deseas cerrar tu corte del día por un total de $${totales.granTotal.toLocaleString()}?\n\nUna vez cerrado no se podrá modificar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Corte', style: 'destructive', onPress: performCorte }
      ]
    );
  };

  const performCorte = async () => {
    setSaving(true);
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected || networkState.isInternetReachable === false) {
        throw new Error('Necesitas conexión a Internet para cerrar el corte del día.');
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // 1. Crear el registro en cortes_diarios
      const { data: corteData, error: corteError } = await supabase
        .from('cortes_diarios')
        .insert({
          cobrador_id: userId,
          total_abonos: totales.abonos,
          total_ahorros: totales.ahorros,
          total_mora: totales.mora,
          gran_total: totales.granTotal,
          estado: 'PENDIENTE'
        })
        .select()
        .single();

      if (corteError) throw corteError;

      // 2. Actualizar todos los pagos con este corte_id
      const pagoIds = pagos.map(p => p.id);
      const { error: updateError } = await supabase
        .from('pagos')
        .update({ corte_id: corteData.id })
        .in('id', pagoIds);

      if (updateError) throw updateError;

      // 3. Imprimir Ticket
      const { data: configData } = await supabase.from('configuracion_empresa').select('*').limit(1).single();
      
      // Armamos un objeto combinado para imprimir
      const corteForPrint = {
        corte: corteData,
        pagos: pagos
      };

      Alert.alert('Éxito', 'Corte cerrado correctamente.\n\nPreparando ticket de impresión...', [
        { text: 'OK', onPress: async () => {
          await PrintService.printCorteTicket(corteForPrint, configData);
          navigation.goBack();
        }}
      ]);

    } catch (err) {
      console.error(err);
      Alert.alert('Error al cerrar corte', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Corte de Caja</Text>
              <Text style={styles.subtitle}>Pagos sin corte</Text>
            </View>

            {pagos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{color: '#94a3b8', textAlign: 'center'}}>No tienes pagos pendientes de corte.</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {pagos.map((p, index) => (
                  <View key={p.id} style={[styles.pagoItem, index === pagos.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.pagoLeft}>
                      <Text style={styles.pagoClient}>
                        {p.creditos?.nombre_cliente || `Folio: ${p.credito_id.substring(0,8)}`}
                      </Text>
                      <Text style={styles.pagoTime}>
                        {new Date(p.fecha_pago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {p.tipo}
                      </Text>
                    </View>
                    <View style={styles.pagoRight}>
                      <Text style={styles.pagoMonto}>${parseFloat(p.monto).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.totalCard}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                <Calculator size={20} color="#10b981" />
                <Text style={styles.totalTitle}> Resumen a Entregar</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Abonos:</Text>
                <Text style={styles.totalValue}>${totales.abonos.toLocaleString()}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Ahorros:</Text>
                <Text style={styles.totalValue}>${totales.ahorros.toLocaleString()}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Mora:</Text>
                <Text style={styles.totalValue}>${totales.mora.toLocaleString()}</Text>
              </View>
              <View style={[styles.totalRow, {borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10, marginTop: 5}]}>
                <Text style={[styles.totalLabel, {fontWeight: 'bold', fontSize: 18, color: '#f8fafc'}]}>Efectivo Total:</Text>
                <Text style={[styles.totalValue, {color: '#10b981', fontSize: 22, fontWeight: 'bold'}]}>${totales.granTotal.toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.saveButton, (pagos.length === 0 || saving) && styles.disabledButton]} 
              onPress={handleCerrarCorte}
              disabled={pagos.length === 0 || saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Save size={24} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.buttonText}>Cerrar Corte del Día</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pagoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pagoLeft: { flex: 1 },
  pagoClient: { color: '#f8fafc', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  pagoTime: { color: '#94a3b8', fontSize: 12 },
  pagoRight: { marginLeft: 15 },
  pagoMonto: { color: '#10b981', fontWeight: 'bold', fontSize: 16 },
  totalCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  totalTitle: { color: '#10b981', fontWeight: 'bold', fontSize: 16, marginLeft: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { color: '#94a3b8', fontSize: 15 },
  totalValue: { color: '#f8fafc', fontWeight: '600', fontSize: 15 },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444', // Rojo para acción importante
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
