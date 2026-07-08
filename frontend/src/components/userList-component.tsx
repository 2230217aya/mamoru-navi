import { StyleSheet, Pressable, Text, Image, DimensionValue } from "react-native";
import { Href, useRouter  } from 'expo-router';

type Props = {
  name: string;
  gender: string;
  age: string;
  blood: string;
  tel: string;
};

export default function userLists({
    name,gender,age,blood,tel,
  }: Props) {
    const router = useRouter();
  return (
    <Pressable style={styles.array}>
      <Text style={styles.cell}>{name}</Text>
      <Text style={styles.cell}>{gender}</Text>
      <Text style={styles.cell}>{age}</Text>
      <Text style={styles.cell}>{blood}</Text>
      <Text style={[styles.cell, { flex:1.5, fontSize: 12, }]}>{tel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  array: {
    backgroundColor: "#DCDCDC",
    borderRadius: 5,
    flexDirection: 'row', // 横並び
    marginVertical: 6,
    alignItems: 'center',

    paddingHorizontal: 10,
    marginHorizontal: 10,
  },

  cell: {
    flex: 0.7,        // ← これ超重要（列を揃える）
    textAlign: 'center',
  }
})
