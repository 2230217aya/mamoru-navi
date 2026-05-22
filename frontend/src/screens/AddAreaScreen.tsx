import React, { useState } from 'react';
import MapView, {
  Marker,
} from 'react-native-maps';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';

export default function AddArea() {

  const [region, setRegion] = useState({
    latitude: 34.7055,
    longitude: 135.4983,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedRadius, setSelectedRadius] =
    useState(3);

  const [areaName, setAreaName] =
    useState('');

  const [postCode, setPostCode] =
    useState('530-0015');

  const [prefecture, setPrefecture] =
    useState('大阪府');

  const [city, setCity] = useState(
    '大阪市北区中崎西',
  );

  const [street, setStreet] =
    useState('２丁目３－３５');

  const radiusOptions = [1, 3, 5];

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
        新しいエリアを追加
      </Text>

      <View style={styles.card}>

        {/* Name */}
        <View style={styles.nameBox}>
        <Text style={styles.icon}>
          🏠
        </Text>

        <TextInput
          value={areaName}
          onChangeText={setAreaName}
          placeholder="表示名を入力"
          placeholderTextColor="#888"
          style={styles.nameLabel}
        />
      </View>

        {/* Address */}
        <View style={styles.addressBox}>
          
          {/* PostCode */}
          <View style={styles.addressTop}>
            <Text style={styles.addressLabel}>
              住所：
            </Text>

            <TextInput
              value={postCode}
              onChangeText={setPostCode}
              style={styles.postCode}
            />
            
          </View>

          {/* Prefecture + City */}
          <View style={styles.addressRow}>
            <TextInput
              value={prefecture}
              onChangeText={
                setPrefecture
              }
              style={styles.addressText}
            />

            <View
              style={styles.verticalLine}
            />

            <TextInput
              value={city}
              onChangeText={setCity}
              style={styles.addressText}
            />
          </View>

          {/* Street */}
          <TextInput
            value={street}
            onChangeText={setStreet}
            style={styles.addressCenter}
          />
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          region={region}
        >
          <Marker coordinate={region} />
        </MapView>

        {/* Radius */}
        <Text style={styles.rangeTitle}>
          範囲
        </Text>

        {radiusOptions.map(radius => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.radiusButton,
              selectedRadius ===
                radius &&
                styles.radiusButtonActive,
            ]}
            onPress={() =>
              setSelectedRadius(radius)
            }
          >
            <View
              style={styles.radioOuter}
            >
              {selectedRadius ===
                radius && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>

            <Text style={styles.radiusText}>
              {radius} km
              {radius === 3 &&
                ' （おすすめ）'}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
        >
          <Text
            style={styles.addButtonText}
          >
            追加
          </Text>
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
    color: '#888',
    fontWeight: '600',
    padding: 0,
  },

  addressBox: {
    marginBottom: 14,

    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },

  addressTop: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 4,
    paddingBottom: 8,
  },

  addressLabel: {
    fontSize: 14,
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

  map: {
    width: '100%',
    height: 160,

    borderWidth: 2,
    borderColor: '#3aa0ff',

    borderRadius: 12,
    overflow: 'hidden',

    marginBottom: 18,
  },

  rangeTitle: {
    fontSize: 18,
    fontWeight: 'bold',

    marginBottom: 14,

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

    marginTop: 20,

    borderRadius: 999,

    alignItems: 'center',

    paddingVertical: 12,
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
});