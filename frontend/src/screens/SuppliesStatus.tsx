import { StyleSheet, Pressable, View, Text, Image, ScrollView } from "react-native";
import { Stack, router  } from 'expo-router';
import { useState, useEffect } from 'react';
import SuppliesGenre from '../components/suppliesGenre-component';
import Clock from '../components/clock-component';
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function suppliesStatus() {
    // ユーザー一覧画面から送られた避難所のIDを取得
    const { SHELTER_ID } = useLocalSearchParams<{SHELTER_ID: string;}>();

    // apiのurl
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
    const SUPPLIES_API_URL = `${API_BASE_URL}/supplies/${SHELTER_ID}`;

    // 物資状況のデータ
    type Supply = {
        name?: string;  // 物資名
        count: number;  // 物資の数量
        // 飲料水 食べ物 寝具 衣類 生活用水 薬 衛生用品 その他
        genre: "drinking_water" | "food" | "bedding" | "clothing" | "domestic_water" | "medicine" | "hygiene_supplies" | "other";
        unit?: string   // 単位(n本とか n食とか)
    };
    // 物資状況の受け取り皿
    const [supplies, setSupplies] = useState<Supply[]>([]);

    // 物資の単位
    const unitConvert: Record<string, string> = {
        bottle: "本",
        meal: "食",
        can: "缶",
        cup: "杯",
        bag: "袋",
        sheet: "枚",
        piece: "張",
        liter: "L",
        tablet: "錠",
        roll: "ロール",
    };

    // バックから送られた避難所データの内データの名前がuseStateと違っていたら入力し直す
    // .testの部分をバックの型名に変更
    const convertSuppliesData = (suppliesData: any) => {
        return suppliesData.map((supply: any) => ({
            name: supply.name,
            count: supply.quantity,
            genre: supply.genre as Supply["genre"],
            unit: unitConvert[supply.unit] ?? supply.unit,
        }));
    };

    // 期限は違うが名前や分類が同じ物資をまとめる
    const mergeSuppliesData = (suppliesData: Supply[]) => {
    const merged: {[key:string]: Supply} = {};
        suppliesData.forEach((supply) => {
            const key = `${supply.genre}_${supply.name}_${supply.unit}`;
            // 同じ物資なら数量を足す
            if (merged[key]) {merged[key].count += supply.count;} 
            else {merged[key] = {...supply};}
        });
        return Object.values(merged);
    };

    const fetchSData = async () => {
        try {
            // 物資状況の情報取得
            const response = await fetch(SUPPLIES_API_URL);
            if (!response.ok) {throw new Error("supplies fetch failed");}
            let suppliesData = await response.json();

            // バックから送られたデータの名前がuseStateと違っていたら名前変換
            suppliesData = convertSuppliesData(suppliesData);

            // 同じ名前の物資をまとめる
            suppliesData = mergeSuppliesData(suppliesData);

            console.log("物資データ:", suppliesData);

            setSupplies(suppliesData);

        } catch (error) {
            console.error(error);
        }
    };

    // 画面表示時に実行
    useFocusEffect(
        useCallback(() => {
            fetchSData();
        }, [SHELTER_ID])
    );

    return(
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.push({
                    pathname:"/supplies-management",
                    params: {SHELTER_ID: SHELTER_ID},
                })}>
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
                    suppliess={supplies}
                />

                <Text style={styles.genre}>食べ物</Text>
                <SuppliesGenre
                    genre="food"
                    suppliess={supplies}
                />

                <Text style={styles.genre}>寝具</Text>
                <SuppliesGenre
                    genre="bedding"
                    suppliess={supplies}
                />

                <Text style={styles.genre}>衣類</Text>
                <SuppliesGenre
                    genre="clothing"
                    suppliess={supplies}
                />

                <Text style={styles.genre}>生活用水</Text>
                <SuppliesGenre
                    genre="domestic_water"
                    suppliess={supplies}
                />

                <Text style={styles.genre}>薬</Text>
                <SuppliesGenre
                    genre="medicine"
                    suppliess={supplies}
                />

                <Text style={styles.genre}>衛生用品</Text>
                <SuppliesGenre
                    genre="hygiene_supplies"
                    suppliess={supplies}
                />

                <Text style={styles.genre}>その他</Text>
                <SuppliesGenre
                    genre="other"
                    suppliess={supplies}
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