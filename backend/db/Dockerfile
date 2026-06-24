FROM postgis/postgis:15-3.4

# 経路計算ツール osm2pgrouting とデータ間引きツール osmconvert をインストール
RUN apt-get update && \
    apt-get install -y osm2pgrouting osmconvert && \
    rm -rf /var/lib/apt/lists/*