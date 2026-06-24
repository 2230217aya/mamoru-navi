import { StyleSheet, Pressable, View, Text, ScrollView, } from "react-native";
import { Stack, router  } from 'expo-router';
import { useState, useEffect } from 'react';
import { Href, useRouter  } from 'expo-router';
import SuppliesStatus from '../components/suppliesStatus-component';

type Supply = {
    name?: string;  // 名前
    count: number;  // 数量
    genre: string;  // ジャンル
    unit?: string;  // 単位(n本とか n食とか)
}

type Props = {
    genre: string;  // ジャンル
    suppliess: Supply[];
}

export default function suppliesGenre({
    genre,suppliess,
}: Props) {
    return(
        <View>
            {suppliess
            .filter(item => item.genre === genre)
            .map((supplies, index) => (
                <SuppliesStatus
                    key={index}
                    name={supplies.name}
                    count={supplies.count}
                    unit={supplies.unit}
                />
            ))}

            {/* 区切り線 */}
            <View style={{ height: 1, backgroundColor: "#000000", width: "95%", alignSelf: "center", margin: 10,}}/>
        </View>
    );
}

const styles = StyleSheet.create({
    
});