FROM node:20

WORKDIR /app

# プロジェクト作成後のため、npm install は不要
# ただし、expo-cliと@expo/ngrokはグローバルに入れておく
RUN npm install -g expo-cli @expo/ngrok

EXPOSE 19000 19001 19002 8081

# コンテナ起動時に何もしない。expo start は後から実行する
CMD ["tail", "-f", "/dev/null"]