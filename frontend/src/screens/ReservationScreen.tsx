import React, { useEffect, useState } from 'react';
import ReservationCompleteScreen from '../screens/Reservationcompletescreen';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type OfficeService = {
  id: string;
  title: string;
  number: string;
};

export default function ReservationScreen() {
  const { facilityId } = useLocalSearchParams<{ facilityId: string }>();
  console.log('facilityId:', facilityId);

  const [services, setServices] = useState<OfficeService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [isComplete, setIsComplete] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<number | null>(null);
  const [waitMinutes, setWaitMinutes] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<OfficeService | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ===== 窓口サービス一覧を取得 ===== NGNGNGNGNGNG
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('user_id', '123e4567-e89b-12d3-a456-426614174000');
        const check = await AsyncStorage.getItem('user_id');
        console.log('DEBUG: user_id の保存に成功しました:', check);
      } catch (err) {
        console.error('DEBUG: user_id の保存に失敗しました:', err);
      }
    })();

    if (!facilityId) return;

    setLoadingServices(true);
    setServicesError(null);

    fetch(`${API_BASE_URL}/facilities/${facilityId}/office-services`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: OfficeService[]) => setServices(data))
      .catch((err) => {
        console.error(err);
        setServicesError('窓口情報の取得に失敗しました');
      })
      .finally(() => setLoadingServices(false));
  }, [facilityId]);

  // ===== 予約作成 =====
  const handleReserve = async () => {
    if (!selectedService || !facilityId || submitting) return;

    setSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        console.error('user_id not found, user might not be logged in');
        setSubmitting(false);
        return;
      }

      const now = new Date();
      const end = new Date(now.getTime() + 30 * 60 * 1000); // とりあえず30分後

      const res = await fetch(`${API_BASE_URL}/reservations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facility_id: facilityId,
          user_id: userId,
          purpose_id: selectedService.id,
          start_time: now.toISOString(),
          end_time: end.toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setReceiptNumber(data.issued_number);
      setWaitMinutes(data.estimated_wait_minutes);
      setIsComplete(true);
    } catch (err) {
      console.error(err);
      // TODO: tampilin toast/alert error ke user
    } finally {
      setSubmitting(false);
    }
  };

  if (isComplete && receiptNumber !== null) {
    return (
      <ReservationCompleteScreen
        issuedNumber={receiptNumber}
        estimatedWaitMinutes={waitMinutes}
        serviceName={selectedService?.title}
        onShowQR={() => router.push('../my-page')}
        onGoHome={() => router.push('../')}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>受付・予約</Text>

      <View style={styles.card}>
        <View style={styles.nameBox}>
          <Text style={styles.icon}>🏠</Text>
          <Text style={styles.nameLabel}>大阪市役所</Text>
        </View>

        <View style={styles.addressBox}>
          <View style={styles.addressTop}>
            <Text style={styles.addressLabel}>現在の待ち状況</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.cardText}>営業時間: 9:00~17:00</Text>
            <Text style={styles.closedText}>定休日: 土日祝</Text>
          </View>

          <View style={styles.updateRow}>
            <Text style={styles.updateText}>最終更新: 10:35</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => console.log('refresh')}
            >
              <Ionicons name="refresh" size={20} color="#373737" />
            </TouchableOpacity>
          </View>

          <View style={styles.serviceBox}>
            {loadingServices ? (
              <ActivityIndicator size="small" color="#373737" />
            ) : servicesError ? (
              <Text style={styles.emptyText}>{servicesError}</Text>
            ) : services.length === 0 ? (
              <Text style={styles.emptyText}>窓口情報がありません</Text>
            ) : (
              services.map((item) => (
                <View key={item.id} style={styles.rowItem}>
                  <Text style={styles.serviceTitle}>{item.title}</Text>
                  <Text style={styles.numberText}>{item.number}番</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <Text style={styles.choiceTitle}>選択</Text>

        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.radiusButton,
              selectedService?.id === service.id && styles.radiusButtonActive,
            ]}
            onPress={() => setSelectedService(service)}
          >
            <View style={styles.radioOuter}>
              {selectedService?.id === service.id && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={styles.radiusText}>{service.title}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.addButton, (!selectedService || submitting) && { opacity: 0.5 }]}
          onPress={handleReserve}
          disabled={!selectedService || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#111" />
          ) : (
            <Text style={styles.addButtonText}>予約</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efefef',
  },

  contentContainer: {
    paddingTop: 40,
    
   

    flexGrow: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#111',
    marginLeft: 15,
  },

  card: {
    width: '100%',
    backgroundColor: '#fff',

    borderRadius: 24,
    padding: 18,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.1,
    shadowRadius: 5,

    elevation: 4,
  },

icon: {
  fontSize: 18,
  marginRight: 8,
},
  nameBox: {
  flexDirection: 'row',
  alignItems: 'center',

  borderBottomWidth: 1,
  borderBottomColor: '#ddd',

  paddingBottom: 10,
  marginBottom: 12,
},

  nameLabel: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    padding: 0,
  },

  addressBox: {
    marginBottom: 14,

    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },

  addressTop: {


    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 4,
    paddingBottom: 8,
  },

  addressLabel: {
    fontSize:16,
    fontWeight: 'bold',
    color: '#222',
  },

  postCode: {
    fontSize: 16,
    color: '#222',
    padding: 0,
  },

  addressRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',

    flexDirection: 'row',
    alignItems: 'center',

    paddingBottom: 8,
    marginBottom: 8,
  },

  addressText: {
    flex: 1,

    fontSize: 15,
    color: '#111',

    padding: 0,

    textAlign: 'center',
    textAlignVertical: 'center',
  },

  verticalLine: {
    width: 1,
    height: '100%',

    backgroundColor: '#ddd',

    marginHorizontal: 12,
  },

  addressCenter: {
    textAlign: 'center',

    fontSize: 15,
    color: '#111',

    padding: 0,
    paddingBottom: 8,
  },


  choiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',

    marginBottom: 12,

    color: '#111',
  },

  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#ccc',

    borderRadius: 10,

    paddingVertical: 10,
    paddingHorizontal: 10,

    marginBottom: 8,

    backgroundColor: '#fff',
  },

  radiusButtonActive: {
    backgroundColor: '#e9e9e9',
    
  },

  radioOuter: {
    width: 20,
    height: 20,

    borderRadius: 99,

    borderWidth: 2,
    borderColor: '#333',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  radioInner: {
    width: 10,
    height: 10,

    borderRadius: 99,

    backgroundColor: '#333',
  },

  radiusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },

  addButton: {
    backgroundColor: '#ffe11a',

    marginTop: 10,

    borderRadius: 999,

    alignItems: 'center',

    paddingVertical: 12,
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    color: '#555',
  },

  closedText: {
    fontSize: 13,
    color: '#666',
  },

  updateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },

  updateText: {
    fontSize: 12,
    color: '#888',
  },

  refreshButton: {
    padding: 4,
  },

  serviceBox: {
    backgroundColor: '#eeeeee',
    borderRadius: 14,
    padding: 14,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 10,
  },

  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  numberText: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  debugText: {
  fontSize: 12,
  color: '#666',
  marginBottom: 10,
},

emptyText: {
  textAlign: 'center',
  color: '#888',
  paddingVertical: 10,
},
});