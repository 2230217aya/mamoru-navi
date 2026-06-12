import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

type Props = {
  receiptNumber?: number;
  waitMinutes?: number;
  serviceName?: string;
  onShowQR?: () => void;
  onGoHome?: () => void;
};

export default function ReservationCompleteScreen({
  receiptNumber = 169,
  waitMinutes = 50,
  serviceName,
  onShowQR,
  onGoHome,
}: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Check icon */}
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={40} color="#4CAF50" />
      </View>

      {/* Title */}
      <Text style={styles.title}>予約完了</Text>

      {/* Receipt card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>受付番号</Text>

        <Text style={styles.receiptNumber}>
          {String(receiptNumber)
            .split('')
            .join('\u2002')}
          番
        </Text>

        <Text style={styles.waitText}>
          待ち時間の目安：約{waitMinutes}分
        </Text>

        {serviceName && (
          <Text style={styles.serviceText}>{serviceName}</Text>
        )}

        <View style={styles.divider} />

        <Text style={styles.noteText}>
          来場時にマイQRコードをご提示のうえ{'\n'}
          チェックインを行ってください
        </Text>
      </View>

      {/* QR Button */}
      <TouchableOpacity
        style={styles.qrButton}
        onPress={onShowQR}
        activeOpacity={0.85}
      >
        
        <Text style={styles.qrButtonText}>マイQRコード</Text>
      </TouchableOpacity>

      {/* Home Button */}
      <TouchableOpacity
        style={styles.homeButton}
        onPress={onGoHome}
        activeOpacity={0.85}
      >
        <Text style={styles.homeButtonText}>ホームへ戻る</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  contentContainer: {
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  // Check circle
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
  },

  // Title
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 24,
    letterSpacing: 1,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: '#ffed93',
    borderRadius: 30,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 25,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  receiptNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  waitText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 15,
    color: '#595f37',
    marginBottom: 8,
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#8c875c',
    marginVertical: 16,
  },
  noteText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },

  // QR Button
  qrButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFE84D',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#373737',
    letterSpacing: 0.5,
  },

  // Home Button
  homeButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 0.5,
  },
});