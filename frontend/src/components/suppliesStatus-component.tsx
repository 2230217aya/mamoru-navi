import { StyleSheet, Pressable, Text, View, } from "react-native";
import { Href, useRouter  } from 'expo-router';
import { blue } from "react-native-reanimated/lib/typescript/Colors";

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
                <Text style={styles.count}>{count}</Text>
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
        fontSize: 18,
        textAlign: "left",
    },
    item: {
        fontSize: 18,
        textAlign: "right",
        flexDirection: "row",
    },
    count: {
        color: "#0004FF",
    },
})