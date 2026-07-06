import { StyleSheet, Pressable, View, Text, Image, ScrollView } from "react-native";
import { Stack, router  } from 'expo-router';
import { useState, useEffect } from 'react';
import SuppliesModal from '../components/suppliesManagement-modal-component';
import SuppliesInput from '../components/suppliesManagement-input-component';

// apiのurl
const API_BASE_URL = "";
// 使用するapiのurl
// /の後に付け足す
const SUPPLIES_API_URL = `${API_BASE_URL}/`;

export default function suppliesManagement() {
    // 入れる・取り出すを切り替える
    const [mode, setMode] = useState<"insert" | "remove">("insert");
    // 選択値
    const [value, setValue] = useState(""); // 品目
    const [unit, setUnit] = useState("");   // 数量
    const [outname, setOutNmae] = useState("");   // 物資名（取り出し用）
    // 入力値
    const [name, setName] = useState("");           // 物資名
    const [deadline, setDeadline] = useState("");   // 有効期限
    const [count, setCount] = useState("");         // 数量
    // モーダルの値
    // 品目
    const options = [
        { label: "飲料水", value: "drinking_water" },
        { label: "食べ物", value: "food" },
        { label: "寝具", value: "bedding" },
        { label: "衣類", value: "clothing" },
        { label: "生活用水", value: "domestic_water" },
        { label: "薬", value: "medicine" },
        { label: "衛生用品", value: "hygiene_supplies" },
        { label: "その他", value: "other" },
    ];
    // 単位
    const units = [
        { label: "本", value: "bottle" },
        { label: "食", value: "meal" },
        { label: "缶", value: "can" },
        { label: "杯", value: "cup" },
        { label: "袋", value: "bag" },
        { label: "枚", value: "sheet" },
        { label: "張", value: "piece" },
        { label: "L", value: "liter" },
        { label: "錠", value: "tablet" },
        { label: "ロール", value: "roll" },
    ];
    
    type Supplies = {
        genre: string;      // 品目
        name: string;       // 物資名
        expiration: string; // 有効期限
        quantity: number;   // 数量
        unit: string;       // 単位
    };
    // 物資情報の受け取り皿
    const [supplies, setSupplies] = useState<Supplies[]>([]);

    // バックから送られたデータの名前が違っていたら入力し直す
    // .testの部分をバックの型名に変更
    const convertSuppliesData = (suppliesData: any) => {
        return suppliesData.map((supplies: any) => ({
        genre: supplies.test,
        name: supplies.test,
        expiration: supplies.test,
        quantity: supplies.test,
        unit: supplies.test,
        }));
    };

    const outOptions = supplies
        .filter((item) => {
            return item.genre === value;
        })
        .map((item) => ({
            label: item.name,
            value: item.name,
    }));

    // 品目変更時に物資名をリセット
    useEffect(() => {
        setOutNmae("");
    }, [value]);

    // 画面表示時に実行
    useEffect(() => {
        const fetchIData = async () => {
            // 物資状況の情報取得(テスト用)
            const testSupplies: Supplies[] = [
                {genre: "food", name: "アルファ化米", expiration: "", quantity: 250, unit: "食"},
                {genre: "food", name: "缶詰", expiration: "", quantity: 55, unit: "缶"},
                {genre: "bedding", name: "パーテーション", expiration: "", quantity: 400, unit: "枚"},
            ];
            setSupplies(testSupplies);

            // // 物資の情報取得
            // const response = await fetch(SUPPLIES_API_URL);
            // const suppliesData: Supplies[] = await response.json();
            // setSupplies(suppliesData);
        };
        fetchIData();
    },[]);

    // タブ切り替え時に内容をクリアする
    const resetForm = () => {
        setValue("");
        setUnit("");
        setOutNmae("");
        setName("");
        setDeadline("");
        setCount("");
    };

    useEffect(() => {
        console.log("supplies更新:", supplies);
    }, [supplies]);

    return(
        <View
            // 背景色をタブの状態で切り替える
            style={[
                styles.container,
                mode === "insert" && styles.backInsert,
                mode === "remove" && styles.backRemove
            ]}>
            {/* タブ */}
            <View style={styles.header}>
                <Pressable
                    style={[
                        styles.Button,
                        mode === "insert" && styles.insert,
                        mode === "remove" && styles.none
                    ]}
                    onPress={() => {
                        resetForm();
                        setMode("insert")
                    }}>
                    <Text style={styles.headerText}>入れる</Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.Button,
                        mode === "insert" && styles.none,
                        mode === "remove" && styles.remove
                    ]}
                    onPress={() => {
                        resetForm();
                        setMode("remove")
                    }}>
                    <Text style={styles.headerText}>取り出す</Text>
                </Pressable>
            </View>

            {/* 入れるを押した時の画面デザイン */}
            {mode === "insert" && (
                <View style={styles.items}>
                    {/* 品目 */}
                    <SuppliesModal
                        categoryName="品目"
                        options={options}
                        value={value}
                        setValue={setValue}
                    />

                    {/* 物資名 */}
                    <SuppliesInput
                        inputName="物資名"
                        text={name}
                        setText={setName}
                    />

                    {/* 有効期限 */}
                    <SuppliesInput
                        inputName="有効期限"
                        text={deadline}
                        setText={setDeadline}
                        keyboardType="numeric"
                    />

                    {/* 数量 */}
                    <View style={styles.countRow}>
                        <SuppliesInput
                            inputName="数量"
                            text={count}
                            setText={setCount}
                            style={styles.countInput}
                            keyboardType="numeric"
                        />

                        <SuppliesModal
                            categoryName = "単位"
                            options = {units}
                            value={unit}
                            setValue={setUnit}
                            style={styles.unitButton}
                        />
                    </View>

                    {/* 送信ボタン */}
                    <Pressable
                        style={styles.submitButton}
                        onPress={() => {
                            console.log("入れる：送信");

                            const quantity = Number(count);
                            setSupplies(prev => {
                                // 既に同じ物資が存在するか
                                const existing = prev.find(
                                    item =>
                                        item.genre === value &&
                                        item.name === name
                                );

                                // あれば数量加算
                                if (existing) {
                                    return prev.map(item =>
                                        item.genre === value &&
                                        item.name === name
                                            ? {
                                                ...item,
                                                quantity:
                                                    item.quantity + quantity
                                            }
                                            : item
                                    );
                                }
                                // なければ新規追加
                                return [
                                    ...prev,
                                    {
                                        genre: value,
                                        name: name,
                                        expiration: deadline,
                                        quantity: quantity,
                                        unit: unit,
                                    }
                                ];
                            });
                            resetForm();    // 入力後にフォームをリセット
                        }}
                    >
                        <Text style={styles.submitText}>送信</Text>
                    </Pressable>
                </View>
            )}

            {/* 取り出すを押した時の画面デザイン */}
            {mode === "remove" && (
                <View style={styles.items}>
                    {/* 品目 */}
                    <SuppliesModal
                        categoryName="品目"
                        options={options}
                        value={value}
                        setValue={setValue}
                    />
                    
                    {/* 物資名 */}
                    <SuppliesModal
                        categoryName="物資名"
                        options={outOptions}
                        value={outname}
                        setValue={setOutNmae}
                    />

                    {/* 数量 */}
                    <SuppliesInput
                        inputName="数量"
                        text={count}
                        setText={setCount}
                        keyboardType="numeric"
                    />

                    {/* 送信ボタン */}
                    <Pressable
                        style={styles.submitButtonOut}
                        onPress={() => {
                            console.log("取り出す：送信");

                            const quantity = Number(count);

                            const selectedSupply = supplies.find(
                                item =>
                                    item.genre === value &&
                                    item.name === outname
                            );

                            // 在庫チェック
                            if (!selectedSupply) {
                                alert("物資が見つかりません");
                                return;
                            }

                            if (selectedSupply.quantity < quantity) {
                                alert("在庫が不足しています");
                                return;
                            }

                            // 数量を減らす
                            setSupplies(prev =>
                                prev
                                    .map(item =>
                                        item.genre === value &&
                                        item.name === outname
                                            ? {
                                                ...item,
                                                quantity:
                                                    item.quantity - quantity,
                                            }
                                            : item
                                    )
                                    .filter(item => item.quantity > 0)
                            );
                            resetForm();    // 入力後にフォームをリセット
                        }}
                    >
                        <Text style={styles.submitTextOut}>送信</Text>
                    </Pressable>
                </View>
            )}
        </View>
    )
}


const styles = StyleSheet.create({
    // 全体のview
    container: {
        flex: 1,
        paddingTop: 50,
        backgroundColor: "#fff",
    },

    backInsert: {
        backgroundColor: "#D9D9D9",
    },
    backRemove: {
        backgroundColor: "#FFF693",
    },

    header: {
        marginBottom: 20,
        flexDirection: "row",
    },
    Button: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 20,
    },
    headerText: {
        fontSize: 30,
    },

    insert: {
        backgroundColor: "#D9D9D9",
    },
    remove: {
        backgroundColor: "#FFF693"
    },
    none: {
        backgroundColor: "#FFF"
    },

    items: {
        margin: 10,
    },

    // 数量・単位用
    countRow: {
        flexDirection: "row",
    },
    countInput: {
        flex: 1,
    },
    unitButton: {
        width: 80,
        marginLeft: 10,
    },

    option: {
        padding: 15,
        fontSize: 18,
    },

    submitButton: {
        marginTop: 20,
        width: 180,
        alignSelf: "center",
        backgroundColor: "#FFF693",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    submitText: {
        color: "#000",
        fontSize: 20,
        fontWeight: "bold",
    },
    submitButtonOut: {
        marginTop: 20,
        width: 180,
        alignSelf: "center",
        backgroundColor: "#9D9D9D",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    submitTextOut: {
        color: "#FFF693",
        fontSize: 20,
        fontWeight: "bold",
    },
});