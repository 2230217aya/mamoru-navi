# ベースとなる公式のNode.jsイメージを指定
FROM node:18

# 作業ディレクトリを設定
WORKDIR /app

# React Native(Expo)の開発に必要なツールをインストール
RUN npm install -g expo-cli @expo/ngrok
# ポートを開けておく
EXPOSE 19000 19001 19002

# コンテナ起動時に何もしない（後からコマンドを実行するため）
CMD ["tail", "-f", "/dev/null"]
