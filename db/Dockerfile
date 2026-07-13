FROM postgis/postgis:15-3.4

# パッケージリストを更新し、pgRouting と osm2pgrouting, osmctools を確実にインストール
RUN apt-get update && \
    apt-get install -y \
    postgresql-15-pgrouting \
    osm2pgrouting \
    osmctools && \
    rm -rf /var/lib/apt/lists/*