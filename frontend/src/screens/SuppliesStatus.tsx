import { StyleSheet, Pressable, View, Text, Image, ScrollView } from "react-native";
import { Stack, router  } from 'expo-router';
import { useState, useEffect } from 'react';
import SuppliesGenre from '../components/suppliesGenre-component';
import Clock from '../components/clock-component';

// apiのurl
const API_BASE_URL = "";
// 使用するapiのurl
// /の後に付け足す
const SUPPLIES_API_URL = `${API_BASE_URL}/`;

export default function suppliesStatus() {
    // 物資状況のデータ
    type supplies = {
        name?: string;  // 物資名
        count: number;  // 物資の数量
        // 飲料水 食べ物 寝具 衣類 生活用水 薬 衛生用品 その他
        genre: "drinking_water" | "food" | "bedding" | "clothing" | "domestic_water" | "medicine" | "hygiene_supplies" | "other";
        unit?: string   // 単位(n本とか n食とか)
    };
    // 物資状況の受け取り皿
    const [suppliess, setSupplies] = useState<supplies[]>([]);

    // バックから送られた避難所データの内データの名前がuseStateと違っていたら入力し直す
    // .testの部分をバックの型名に変更
    const convertSuppliesData = (suppliesData: any) => {
        return suppliesData.map((supplies: any) => ({
        name: supplies.test,
        count: supplies.test,
        genre: supplies.test,
        unit: supplies.test,
        }));
    };

    // 画面表示時に実行
    useEffect(() => {
        const fetchSData = async () => {
            // 物資状況の情報取得(テスト用)
            const testSupplies: supplies[] = [
                // 飲料水
                {name: "", count: 500, genre: "drinking_water", unit: "本"},
                // 食べ物
                {name: "アルファ化米", count: 250, genre: "food", unit: "食"},
                {name: "缶詰", count: 55, genre: "food", unit: "缶"},
                {name: "カップラーメン", count: 100, genre: "food", unit: "杯"},
                {name: "乾パン", count: 150, genre: "food", unit: "袋"},
                // 寝具・衣類
                {name: "パーテーション", count: 400, genre: "bedding", unit: "枚"},
                {name: "テント", count: 60, genre: "bedding", unit: "張"},
                {name: "マット", count: 120, genre: "bedding", unit: "枚"},
                // 生活用水
                {name: "", count: 150000, genre: "domestic_water", unit: "L"},
                // 薬
                {name: "解熱鎮痛剤", count: 20, genre: "medicine", unit: "錠"},
                {name: "胃腸薬", count: 20, genre: "medicine", unit: "錠"},
                {name: "消毒液", count: 20, genre: "medicine", unit: "錠"},
                {name: "皮膚薬", count: 20, genre: "medicine", unit: "錠"},
                {name: "整腸剤", count: 20, genre: "medicine", unit: "錠"},
                {name: "目薬", count: 10, genre: "medicine", unit: "本"},
                {name: "鎮痛剤", count: 20, genre: "medicine", unit: "錠"},
                {name: "風邪薬", count: 50, genre: "medicine", unit: "錠"},
                // 衛生用品
                {name: "トイレットペーパー", count: 120, genre: "hygiene_supplies", unit: "ロール"},
                {name: "紙おむつ", count: 300, genre: "hygiene_supplies", unit: "枚"},
                {name: "生理用品", count: 300, genre: "hygiene_supplies", unit: "枚"},
                // その他
                {name: "保温シート", count: 200, genre: "other", unit: "枚"},
                {name: "ゴミ袋", count: 200, genre: "other", unit: "枚"},
                {name: "乾電池", count: 80, genre: "other", unit: "本"},
                {name: "ガソリン", count: 20, genre: "other", unit: "リットル"},
            ];
            setSupplies(testSupplies);

            // // 物資状況の情報取得
            // const response = await fetch(SUPPLIES_API_URL);
            // const suppliesData = await response.json();
            // setSupplies(suppliesData);
        };
        fetchSData();
    },[]);

    return(
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.push("/")}>
                    <Text style={styles.supplyStatus}>物資状況＞</Text>
                </Pressable>
                {/* 現在時刻取得 */}
                <Clock />
            </View>

            {/* ここに取得した物資状況のデータ */}
            <ScrollView style={styles.list}>
                <Text style={styles.genre}>飲料水</Text>
                <SuppliesGenre
                    genre="drinking_water"
                    suppliess={suppliess}
                />

                <Text style={styles.genre}>食べ物</Text>
                <SuppliesGenre
                    genre="food"
                    suppliess={suppliess}
                />

                <Text style={styles.genre}>寝具</Text>
                <SuppliesGenre
                    genre="bedding"
                    suppliess={suppliess}
                />

                <Text style={styles.genre}>衣類</Text>
                <SuppliesGenre
                    genre="clothing"
                    suppliess={suppliess}
                />

                <Text style={styles.genre}>生活用水</Text>
                <SuppliesGenre
                    genre="domestic_water"
                    suppliess={suppliess}
                />

                <Text style={styles.genre}>薬</Text>
                <SuppliesGenre
                    genre="medicine"
                    suppliess={suppliess}
                />

                <Text style={styles.genre}>衛生用品</Text>
                <SuppliesGenre
                    genre="hygiene_supplies"
                    suppliess={suppliess}
                />

                <Text style={styles.genre}>その他</Text>
                <SuppliesGenre
                    genre="other"
                    suppliess={suppliess}
                />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
  // 全体のview
  container: {
    flex: 1,
    // justifyContent: 'flex-start',
    // alignItems: 'stretch',     // 横中央
    // paddingTop: 80,
    padding : 10,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,

    height: 120,

    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  supplyStatus: {
    fontSize: 30,
    textAlign: 'center',
    marginTop: 60,
    fontWeight: 'bold',
  },

  list: {
    marginTop: 120,
  },

  genre: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});