FROM node:18

WORKDIR /app

# React Native(Expo)の開発に必要なツールをインストール
# プロジェクト作成時にnpm installが行われるため、ここでは実行しない
RUN npm install -g expo-cli @expo/ngrok

EXPOSE 19000 19001 19002 8081

# コンテナ起動時に何もしない。expo start は後から実行する
CMD ["tail", "-f", "/dev/null"]