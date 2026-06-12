import React, { useState } from 'react';
import ReservationCompleteScreen from '../screens/Reservationcompletescreen';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
type OfficeService = {
  id: number;
  title: string;
  number: string;
};
  const mockServices: OfficeService[] = [
  {
    id: 1,
    title: '証明書の発行',
    number: '22',
  },
  {
    id: 2,
    title: '住所の変更・印鑑登録',
    number: '57',
  },
  {
    id: 3,
    title: 'マイナンバー',
    number: '132',
  },
  {
    id: 4,
    title: '戸籍の提出・相談',
    number: '12',
  },
];
const serviceOptions = [
  '証明書の発行',
  '住所の変更・印鑑登録',
  'マイナンバー',
  '戸籍の提出・相談',
];


export default function ReservationScreen() {
const [isComplete, setIsComplete] = useState(false);
const [receiptNumber] = useState(169); // 實際應從 API 取得
const [selectedService, setSelectedService] =
  useState<string | null>(null);
    if (isComplete) {
    return (
      <ReservationCompleteScreen
        receiptNumber={receiptNumber}
        waitMinutes={50}
        serviceName={selectedService ?? undefined}
        onShowQR={() => router.push('../my-page')}
        onGoHome={() => router.push('../')}
      />
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={styles.title}>
        受付・予約
      </Text>

      <View style={styles.card}>

        {/* Name */}
        <View style={styles.nameBox}>
        <Text style={styles.icon}>
          🏠
        </Text>

        <Text style={styles.nameLabel}>大阪市役所</Text>
      </View>

        {/* Address */}
        <View style={styles.addressBox}>
          
          {/* PostCode */}
          <View style={styles.addressTop}>
            <Text style={styles.addressLabel}>
              現在の待ち状況
            </Text>

          
            
          </View>

          <View style={styles.infoRow}>

        <Text style={styles.cardText}>
          営業時間: 9:00~17:00
        </Text>

        <Text style={styles.closedText}>
          定休日: 土日祝
        </Text>

      </View>

      <View style={styles.updateRow}>

        <Text style={styles.updateText}>
          最終更新: 10:35
        </Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            console.log('refresh');
          }}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#373737"
          />
        </TouchableOpacity>

      </View>

      <View style={styles.serviceBox}>

        {mockServices.map((item) => (

          <View
            key={item.id}
            style={styles.rowItem}
          >

            <Text style={styles.serviceTitle}>
              {item.title}
            </Text>

            <Text style={styles.numberText}>
              {item.number}番
            </Text>

          </View>

        ))}

      </View>
    

      </View>
        <Text style={styles.choiceTitle}>
          選択
        </Text>

        {serviceOptions.map(service => (
        <TouchableOpacity
          key={service}
          style={[
            styles.radiusButton,
            selectedService === service &&
              styles.radiusButtonActive,
          ]}
          onPress={() =>
            setSelectedService(service)
          }
        >
          <View style={styles.radioOuter}>
            {selectedService === service && (
              <View
                style={styles.radioInner}
              />
            )}
          </View>

          <Text style={styles.radiusText}>
            {service}
          </Text>

        </TouchableOpacity>
      ))}
        {/* Button */}
        <TouchableOpacity
        style={styles.addButton}
        onPress={() => selectedService && setIsComplete(true)}  // ← これを追加
      >
        <Text style={styles.addButtonText}>予約</Text>
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