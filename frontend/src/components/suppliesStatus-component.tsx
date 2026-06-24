import { StyleSheet, Pressable, Text, View, } from "react-native";
import { Href, useRouter  } from 'expo-router';

type Props = {
    name?: string;  // 名前
    count: number;  // 数量
    unit?: string;  // 単位(n本とか n食とか)
}

export default function suppliesStatus({
    name,count,unit,
}: Props) {
    return(
        <Pressable style={styles.array}>
            <Text style={styles.name}>{name}</Text>
            <Text  style={styles.item}>
                {count}
                {unit}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    array: {
        flexDirection: "row",
        justifyContent: "space-between",    // 左右に配置
    },

    name: {
        fontSize: 15,
        textAlign: "left",
    },
    item: {
        fontSize: 15,
        textAlign: "right",
        flexDirection: "row",
    },
})