import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { PrintService } from '../lib/printService';
import { Printer, FileText, Calendar } from 'lucide-react-native';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { enrichCreditData } from '../lib/penalties';

export default function HistorialScreen() {
  const [activeTab, setActiveTab] = useState('PAGOS'); // 'PAGOS' | 'CORTES'
  const [pagos, setPagos] = useState([]);
  const [cortes, setCortes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configData, setConfigData] = useState(null);

  const fetchData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      const { data: config } = await supabase.from('configuracion_empresa').select('*').limit(1).single();
      setConfigData(config);

      if (activeTab === 'PAGOS') {
        const { data, error } = await supabase
          .from('pagos')
          .select(`
            *,
            creditos(tipo, nombre_cliente, saldo_pendiente, clientes(nombre_completo), grupos(nombre))
          `)
          .eq('registrado_por', userId)
          .order('fecha_pago', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        // Agrupar por transaction_group_id para no repetir el mismo ticket 3 veces (si hay abono, mora y ahorro juntos)
        const grouped = [];
        const seenDates = new Set();
        
        if (data) {
          data.forEach(p => {
            // Un proxy rápido para agrupar es la fecha_pago exacta al milisegundo (o un ID de transacción)
            const dateKey = p.fecha_pago;
            if (!seenDates.has(dateKey)) {
              seenDates.add(dateKey);
              grouped.push(p);
            }
          });
        }
        
        setPagos(grouped);
      } else {
        const { data, error } = await supabase
          .from('cortes_diarios')
          .select('*')
          .eq('cobrador_id', userId)
          .order('fecha', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        setCortes(data || []);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [activeTab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePrintPago = async (pago) => {
    try {
      Alert.alert('Imprimiendo...', 'Obteniendo datos del ticket');
      // Obtener hermanos (siblings)
      const { data: siblings } = await supabase
        .from('pagos')
        .select(`
          *,
          integrantes_grupo(nombre_completo)
        `)
        .eq('credito_id', pago.credito_id)
        .eq('fecha_pago', pago.fecha_pago);
        
      // Obtener balance real
      const { data: todosPagos } = await supabase
        .from('pagos')
        .select('*')
        .eq('credito_id', pago.credito_id);
        
      const { data: creditoRow } = await supabase
        .from('vista_saldos_creditos')
        .select('*')
        .eq('credito_id', pago.credito_id)
        .single();
        
      const enriched = enrichCreditData(
        creditoRow || pago.creditos,
        todosPagos || [], 
        parseFloat(creditoRow?.saldo_pendiente || pago.creditos.saldo_pendiente)
      );

      const ticketData = {
        primary: {
          ...pago,
          perfiles: { nombre_completo: 'Tú (Reimpresión)' }
        },
        siblings: siblings || [pago],
        adeudo_actual: enriched ? enriched.adeudo_total_real : 0
      };

      await PrintService.printTicket(ticketData, configData);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handlePrintCorte = async (corte) => {
    try {
      Alert.alert('Imprimiendo...', 'Obteniendo datos del corte');
      const { data: pagosDelCorte } = await supabase
        .from('pagos')
        .select(`
          *,
          creditos(tipo, nombre_cliente, clientes(nombre_completo), grupos(nombre)),
          integrantes_grupo(nombre_completo)
        `)
        .eq('corte_id', corte.id)
        .order('fecha_pago', { ascending: true });

      const corteData = {
        corte: {
          ...corte,
          cobrador: { nombre_completo: 'Tú' }
        },
        pagos: pagosDelCorte || []
      };

      await PrintService.printCorteTicket(corteData, configData);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PAGOS' && styles.activeTab]}
          onPress={() => setActiveTab('PAGOS')}
        >
          <Text style={[styles.tabText, activeTab === 'PAGOS' && styles.activeTabText]}>Mis Pagos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CORTES' && styles.activeTab]}
          onPress={() => setActiveTab('CORTES')}
        >
          <Text style={[styles.tabText, activeTab === 'CORTES' && styles.activeTabText]}>Mis Cortes</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView 
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {activeTab === 'PAGOS' && (
            pagos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{color: '#94a3b8'}}>No hay pagos registrados recientes.</Text>
              </View>
            ) : (
              pagos.map(p => (
                <View key={p.id} style={styles.card}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                    <View style={{flex: 1}}>
                      <Text style={styles.cardTitle}>
                        {p.creditos?.nombre_cliente || p.creditos?.clientes?.nombre_completo || p.creditos?.grupos?.nombre || p.credito_id.substring(0,8)}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {format(new Date(p.fecha_pago), 'dd/MM/yyyy HH:mm')}
                      </Text>
                    </View>
                    <View style={{backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12}}>
                      <Text style={{color: '#10b981', fontWeight: 'bold'}}>${parseFloat(p.monto).toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handlePrintPago(p)}
                  >
                    <Printer size={18} color="#f8fafc" style={{marginRight: 8}} />
                    <Text style={styles.actionButtonText}>Reimprimir Ticket</Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          )}

          {activeTab === 'CORTES' && (
            cortes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{color: '#94a3b8'}}>No hay cortes registrados.</Text>
              </View>
            ) : (
              cortes.map(c => (
                <View key={c.id} style={styles.card}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                    <View style={{flex: 1}}>
                      <Text style={styles.cardTitle}>
                        Corte {c.id.split('-')[0].toUpperCase()}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {format(new Date(c.fecha), 'dd/MM/yyyy HH:mm')}
                      </Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                        <View style={[styles.badge, c.estado === 'PENDIENTE' ? styles.badgeWarning : styles.badgeSuccess]}>
                          <Text style={[styles.badgeText, c.estado === 'PENDIENTE' ? styles.badgeWarningText : styles.badgeSuccessText]}>
                            {c.estado}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12}}>
                      <Text style={{color: '#10b981', fontWeight: 'bold'}}>${parseFloat(c.gran_total).toLocaleString()}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handlePrintCorte(c)}
                  >
                    <Printer size={18} color="#f8fafc" style={{marginRight: 8}} />
                    <Text style={styles.actionButtonText}>Reimprimir Corte</Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: '#3b82f6'
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '600'
  },
  activeTabText: {
    color: '#3b82f6'
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15 },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  cardSubtitle: { color: '#94a3b8', fontSize: 13 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2
  },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  badgeWarningText: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold' },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  badgeSuccessText: { color: '#10b981', fontSize: 11, fontWeight: 'bold' },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  actionButtonText: { color: '#f8fafc', fontWeight: 'bold', fontSize: 14 }
});
