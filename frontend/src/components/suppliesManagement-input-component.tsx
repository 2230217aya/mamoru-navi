import { StyleSheet, TextInput, TextInputProps } from "react-native";

type Props = {
    inputName: string;   // 入力するやつの名前（何も入れてないと出るやつ）
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
    style?: any;    // デザイン変更
    keyboardType?: TextInputProps["keyboardType"];
};

export default function suppliesInput({
    inputName,text,setText,style,keyboardType,
  }: Props) {
    return (
        <TextInput
            placeholder={inputName}
            placeholderTextColor="#9D9D9D"
            value={text}
            onChangeText={setText}
            style={[styles.input, style]}
            keyboardType={keyboardType}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        height: 48,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
        margin: 5,
    }
});