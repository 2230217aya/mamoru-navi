import { StyleSheet, Pressable, Text, Modal, View, } from "react-native";
import { useState } from "react";

type Option = {
    label: string;
    value: string;
};

type Props = {
    categoryName: string;   // モーダルの名前
    options: Option[];      // モーダルの中身
    // 開くときに使うやつ
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
    style?: any;    // デザイン変更
};

export default function suppliesModal({
    categoryName,options,value,setValue,style,
  }: Props) {
    const [open, setOpen] = useState(false);        // モーダルの開閉
    const selectedLabel = options.find(item => item.value === value)?.label;

    return (
        <>
        {/* モーダル表示部分 */}
        <Pressable
            style={[styles.box, style]}
            onPress={() => setOpen(true)}
        >
            <Text
                style={
                    selectedLabel
                        ? styles.text
                        : styles.nullText
                }
            >
                {selectedLabel || categoryName}
            </Text>
            <Text style={styles.arrow}>▼</Text>
        </Pressable>
        {/* モーダル（タップ時だけ出る） */}
        <Modal
            visible={open}
            transparent
            animationType="fade"
        >
            <Pressable
                style={styles.modalBg}
                onPress={() => setOpen(false)}
            >
                <View style={styles.modal}>
                {options.map((item) => (
                    <Pressable
                    key={item.value}
                    onPress={() => {
                        setValue(item.value);
                        setOpen(false);
                    }}
                    >
                    <Text style={{ padding: 10 }}>{item.label}</Text>
                    </Pressable>
                ))}
                </View>
            </Pressable>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // 普段の表示（小さく）
    box: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",

        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",

        paddingHorizontal: 12,
        paddingVertical: 12,

        height: 48,
        margin: 5,
    },

    arrow: {
        color: "#666",
        fontSize: 14,
    },

    // 選択肢の白い箱
    modal: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
    },

    // 背景を暗くする
    modalBg: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },

    text: {
        color: "#000",
    },
    nullText: {
        color: "#9D9D9D",
    },
});