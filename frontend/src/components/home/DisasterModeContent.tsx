import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  expanded: boolean;
};

export default function DisasterModeContent({ expanded }: Props) {
  if (!expanded) return null;
 const shelterData = {
    capacity: 50,

    toilet: {
      maleSmall: 3,
      maleBig: 2,
      female: 5,
    },

    bath: true,

    supplies: [
      {
        name: '飲料水',
        status: '十分',
      },
      {
        name: '食料',
        status: '十分',
      },
      {
        name: '衛生用品',
        status: '十分',
      },
      {
        name: '寝具・衣類',
        status: '不足',
      },
    ],
  };

 return (
    <View style={styles.container}>

      {/* 最大收容人数 */}
      <View style={styles.row}>
        <Text style={styles.label}>
          最大収容人数
        </Text>

        <Text style={styles.value}>
          {shelterData.capacity}
        </Text>
      </View>

      {/* トイレ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          トイレ
        </Text>

        <Text style={styles.text}>
          男性用トイレ：小便器{shelterData.toilet.maleSmall}基、便器{shelterData.toilet.maleBig}基
        </Text>

        <Text style={styles.text}>
          女性用トイレ：便器{shelterData.toilet.female}基
        </Text>
      </View>

      {/* 入浴施設 */}
      <View style={styles.row}>
        <Text style={styles.label}>
          入浴施設
        </Text>

        <Text
          style={[
            styles.statusText,
            {
              color: shelterData.bath ? '#1BAA00' : '#FF3B30',
            },
          ]}
        >
          {shelterData.bath ? 'あり' : 'なし'}
        </Text>
      </View>

      {/* 備蓄物資 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          備蓄されている物資
        </Text>

        {shelterData.supplies.map((item, index) => (
          <View
            key={index}
            style={styles.supplyRow}
          >
            <Text style={styles.supplyName}>
              {item.name}
            </Text>

            <Text
              style={[
                styles.supplyStatus,
                {
                  color:
                    item.status === '十分'
                      ? '#1BAA00'
                      : '#FF3B30',
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },

  // 左右排列
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 20,
  },

  label: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  value: {
    fontSize: 17,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  text: {
    fontSize: 15,
    lineHeight: 24,
  },

  statusText: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  // 物資 row
  supplyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 6,
  },

  supplyName: {
    fontSize: 15,
  },

  supplyStatus: {
    fontSize: 15,
    fontWeight: 'bold',
  },

});