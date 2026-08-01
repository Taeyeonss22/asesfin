import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image as RNImage, ScrollView } from 'react-native';

import { supabase } from '../lib/supabase';
import { SyncService } from '../lib/syncService';
import { PrintService } from '../lib/printService';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Camera, MapPin, MapPinOff, Save, Calculator } from 'lucide-react-native';
import * as Network from 'expo-network';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

export default function CobroScreen({ route }) {
  const { credito, location: initialLocation, perfil } = route.params;
  const navigation = useNavigation();

  // Individual fields
  const [pagosInd, setPagosInd] = useState({ abono: '', ahorro: '', mora: '' });

  // Group fields
  const [integrantes, setIntegrantes] = useState([]);
  const [pagosGrupal, setPagosGrupal] = useState({}); // { id: { abono: '', ahorro: '', mora: '' } }
  
  const [location, setLocation] = useState(initialLocation || null);
  const [photoUri, setPhotoUri] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [numeroPago, setNumeroPago] = useState(1);

  useEffect(() => {
    supabase.from('pagos').select('numero_pago').eq('credito_id', credito.credito_id).then(({data}) => {
      if (data && data.length > 0) {
        const maxPago = Math.max(...data.map(p => p.numero_pago || 0));
        setNumeroPago(Math.min(maxPago + 1, credito.numero_periodos || 16));
      } else {
        setNumeroPago(1);
      }
    });
    
    if (credito.tipo === 'GRUPAL') {
      fetchIntegrantes();
    }
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc.coords);
      } catch (e) {
        console.warn("Could not get location", e);
      }
    }
    await ImagePicker.requestCameraPermissionsAsync();
  };

  const fetchIntegrantes = async () => {
    const { data } = await supabase
      .from('vista_saldos_integrantes')
      .select('*')
      .eq('credito_id', credito.credito_id);
    if (data) {
      setIntegrantes(data);
      const initialState = {};
      data.forEach(int => {
        initialState[int.integrante_id] = { abono: '', ahorro: '', mora: '' };
      });
      setPagosGrupal(initialState);
    }
  };

  const handleGrupalChange = (id, field, value) => {
    setPagosGrupal(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const totalesGrupal = useMemo(() => {
    let tAbono = 0;
    let tAhorro = 0;
    let tMora = 0;
    
    if (credito.tipo === 'INDIVIDUAL') {
      tAbono = parseFloat(pagosInd.abono) || 0;
      tAhorro = parseFloat(pagosInd.ahorro) || 0;
      tMora = parseFloat(pagosInd.mora) || 0;
    } else {
      Object.values(pagosGrupal).forEach(p => {
        tAbono += parseFloat(p.abono) || 0;
        tAhorro += parseFloat(p.ahorro) || 0;
        tMora += parseFloat(p.mora) || 0;
      });
    }

    return { 
      abono: tAbono, 
      ahorro: tAhorro, 
      mora: tMora, 
      granTotal: tAbono + tAhorro + tMora 
    };
  }, [pagosGrupal, pagosInd, credito.tipo]);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const timestamp = new Date().toISOString();

      let evidencia_url = null;
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable !== false;

      if (totalesGrupal.granTotal <= 0) {
        throw new Error('Debes capturar al menos un monto válido.');
      }

      // Upload photo if online
      if (photoUri && isOnline) {
        const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: FileSystem.EncodingType.Base64 });
        const filePath = `${userId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('evidencias_pagos').upload(filePath, decode(base64), { contentType: 'image/jpeg' });
        if (!uploadError) {
          const { data } = supabase.storage.from('evidencias_pagos').getPublicUrl(filePath);
          evidencia_url = data.publicUrl;
        }
      }

      const inserts = [];

      if (credito.tipo === 'INDIVIDUAL') {
        const pAbono = parseFloat(pagosInd.abono) || 0;
        const pAhorro = parseFloat(pagosInd.ahorro) || 0;
        const pMora = parseFloat(pagosInd.mora) || 0;

        const baseData = {
          credito_id: credito.credito_id,
          integrante_id: null,
          fecha_pago: timestamp,
          latitud: location ? location.latitude : null,
          longitud: location ? location.longitude : null,
          evidencia_url: evidencia_url,
          registrado_por: userId,
          numero_pago: parseInt(numeroPago)
        };

        if (pAbono > 0) {
          if (pAbono > credito.saldo_pendiente) throw new Error('El abono no puede ser mayor al saldo pendiente');
          inserts.push({ ...baseData, monto: pAbono, tipo: 'ABONO' });
        }
        if (pAhorro > 0) inserts.push({ ...baseData, monto: pAhorro, tipo: 'AHORRO' });
        if (pMora > 0) inserts.push({ ...baseData, monto: pMora, tipo: 'MORA' });
      } else {
        for (const int of integrantes) {
          const p = pagosGrupal[int.integrante_id];
          if (!p) continue;

          const pAbono = parseFloat(p.abono) || 0;
          const pAhorro = parseFloat(p.ahorro) || 0;
          const pMora = parseFloat(p.mora) || 0;
          
          const baseData = {
            credito_id: credito.credito_id,
            integrante_id: int.integrante_id,
            fecha_pago: timestamp,
            latitud: location ? location.latitude : null,
            longitud: location ? location.longitude : null,
            evidencia_url: evidencia_url,
            registrado_por: userId,
            numero_pago: parseInt(numeroPago)
          };

          if (pAbono > 0) inserts.push({ ...baseData, monto: pAbono, tipo: 'ABONO' });
          if (pAhorro > 0) inserts.push({ ...baseData, monto: pAhorro, tipo: 'AHORRO' });
          if (pMora > 0) inserts.push({ ...baseData, monto: pMora, tipo: 'MORA' });
        }
      }

      // We need a representative payment object for the ticket
      const pagoForTicket = {
        ...inserts[0],
        monto: totalesGrupal.granTotal,
        creditos: credito,
        local_uri: !isOnline ? photoUri : null
      };

      if (isOnline) {
        const { data, error } = await supabase.from('pagos').insert(inserts).select();
        if (error) {
           throw new Error(`Error guardando el pago y sus metadatos: ${error.message}`);
        }
        
        const { data: configData } = await supabase.from('configuracion_empresa').select('*').limit(1).single();
        
        Alert.alert('Éxito', 'Pago(s) registrado(s) correctamente.\n\n¿Deseas imprimir el ticket?', [
          { text: 'No', onPress: () => navigation.goBack() },
          { text: 'Sí, Imprimir', onPress: async () => {
              await PrintService.printTicket(pagoForTicket, configData);
              navigation.goBack();
          }}
        ]);
      } else {
        // Offline: enqueue all inserts individually, or as a batch.
        // SyncService currently handles individual objects, we can enqueue each.
        for (const ins of inserts) {
          ins.local_uri = photoUri; // Attach to all, sync service might duplicate upload but it's safe
          await SyncService.addToQueue(ins);
        }
        
        Alert.alert('Modo Offline', 'Pago guardado localmente.\n\n¿Deseas imprimir el ticket?', [
          { text: 'No', onPress: () => navigation.goBack() },
          { text: 'Sí, Imprimir', onPress: async () => {
              await PrintService.printTicket(pagoForTicket, { nombre_empresa: 'Offline' });
              navigation.goBack();
          }}
        ]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Registrar Cobro</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Periodo a Pagar (Semana)</Text>
        <View style={{ backgroundColor: '#0f172a', borderRadius: 8, marginTop: 5, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
          <Picker
            selectedValue={numeroPago}
            onValueChange={(itemValue) => setNumeroPago(itemValue)}
            style={{ color: '#fff' }}
            dropdownIconColor="#fff"
          >
            {Array.from({ length: credito.numero_periodos || 16 }, (_, i) => i + 1).map(num => (
              <Picker.Item key={num} label={`Semana ${num} de ${credito.numero_periodos || 16}`} value={num} />
            ))}
          </Picker>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{credito.nombre_cliente || `Grupo: ${credito.credito_id.substring(0,8)}`}</Text>
        <Text style={styles.cardText}>Saldo pendiente: ${credito.saldo_pendiente?.toLocaleString()}</Text>
      </View>

      {credito.tipo === 'INDIVIDUAL' ? (
        // VISTA PLANILLA INDIVIDUAL (MÓVIL)
        <View style={styles.groupContainer}>
          <Text style={styles.label}>Desglose del Pago</Text>
          <View style={styles.integranteCard}>
            <Text style={styles.intName}>{credito.nombre_cliente}</Text>
            <Text style={styles.intBalance}>Saldo: ${parseFloat(credito.saldo_pendiente).toLocaleString()}</Text>
            
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Abono</Text>
                <TextInput
                  style={styles.gridInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                  value={pagosInd.abono}
                  onChangeText={(v) => setPagosInd({...pagosInd, abono: v})}
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Ahorro</Text>
                <TextInput
                  style={styles.gridInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                  value={pagosInd.ahorro}
                  onChangeText={(v) => setPagosInd({...pagosInd, ahorro: v})}
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Mora</Text>
                <TextInput
                  style={styles.gridInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                  value={pagosInd.mora}
                  onChangeText={(v) => setPagosInd({...pagosInd, mora: v})}
                />
              </View>
            </View>
          </View>
        </View>
      ) : (
        // VISTA PLANILLA GRUPAL (MÓVIL)
        <View style={styles.groupContainer}>
          <Text style={styles.label}>Desglose por Integrante</Text>
          {integrantes.map(int => (
            <View key={int.integrante_id} style={styles.integranteCard}>
              <Text style={styles.intName}>{int.nombre_completo}</Text>
              <Text style={styles.intBalance}>Saldo: ${parseFloat(int.saldo_pendiente).toLocaleString()}</Text>
              
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Abono</Text>
                  <TextInput
                    style={styles.gridInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666"
                    value={pagosGrupal[int.integrante_id]?.abono || ''}
                    onChangeText={(v) => handleGrupalChange(int.integrante_id, 'abono', v)}
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Ahorro</Text>
                  <TextInput
                    style={styles.gridInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666"
                    value={pagosGrupal[int.integrante_id]?.ahorro || ''}
                    onChangeText={(v) => handleGrupalChange(int.integrante_id, 'ahorro', v)}
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Mora</Text>
                  <TextInput
                    style={styles.gridInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#666"
                    value={pagosGrupal[int.integrante_id]?.mora || ''}
                    onChangeText={(v) => handleGrupalChange(int.integrante_id, 'mora', v)}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Consolidado */}
          <View style={styles.totalCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
              <Calculator size={18} color="#3b82f6" />
              <Text style={styles.totalTitle}> Total Consolidado</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Abonos:</Text>
              <Text style={[styles.totalValue, {color: '#10b981'}]}>${totalesGrupal.abono.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Ahorros:</Text>
              <Text style={styles.totalValue}>${totalesGrupal.ahorro.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Mora:</Text>
              <Text style={[styles.totalValue, {color: '#ef4444'}]}>${totalesGrupal.mora.toLocaleString()}</Text>
            </View>
            <View style={[styles.totalRow, {borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10, marginTop: 5}]}>
              <Text style={[styles.totalLabel, {fontWeight: 'bold', fontSize: 16}]}>Gran Total:</Text>
              <Text style={[styles.totalValue, {color: '#3b82f6', fontSize: 18, fontWeight: 'bold'}]}>${totalesGrupal.granTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.label}>Evidencia Fotográfica</Text>
      <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
        <Camera size={24} color="#fff" style={{marginRight: 8}} />
        <Text style={styles.buttonText}>{photoUri ? 'Cambiar Foto' : 'Tomar Foto'}</Text>
      </TouchableOpacity>
      
      {photoUri && (
        <RNImage source={{ uri: photoUri }} style={styles.previewImage} />
      )}

      <View style={styles.locationContainer}>
        {location ? (
          <>
            <MapPin size={20} color="#10b981" />
            <Text style={styles.locText}>Ubicación GPS capturada</Text>
          </>
        ) : (
          <>
            <MapPinOff size={20} color="#ef4444" />
            <Text style={styles.locText}>Sin ubicación (se reportará)</Text>
          </>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.disabledButton]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Save size={24} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>
              Registrar ${totalesGrupal.granTotal.toLocaleString()}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardText: {
    color: '#94a3b8',
    marginTop: 5,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeText: {
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  typeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  groupContainer: {
    marginBottom: 20,
  },
  integranteCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  intName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  intBalance: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  gridLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  gridInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: '#475569',
    color: '#fff',
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  totalTitle: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    color: '#94a3b8',
  },
  totalValue: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  photoButton: {
    flexDirection: 'row',
    backgroundColor: '#475569',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  locText: {
    color: '#cbd5e1',
    marginLeft: 10,
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
