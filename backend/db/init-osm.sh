#!/bin/bash
set -e

OSM_FILE="/tmp/osaka_city.osm"
PBF_FILE="/tmp/kinki-latest.osm.pbf"

# 1. 大阪エリアの抽出（まだ .osm ファイルがない場合）
if [ ! -f "$OSM_FILE" ] && [ -f "$PBF_FILE" ]; then
    echo "📍 大阪エリアの抽出を開始します..."
    osmconvert "$PBF_FILE" -b=135.35,34.58,135.65,34.78 -o="$OSM_FILE"
fi

# 2. 道路データの自動インポート（waysテーブルがない場合）
# psql でテーブルの存在を確認
TABLE_EXISTS=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ways');")

if [ "$TABLE_EXISTS" = "f" ] && [ -f "$OSM_FILE" ]; then
    echo "🚀 道路データの自動インポートを開始します..."
    osm2pgrouting \
      -f "$OSM_FILE" \
      -d "$POSTGRES_DB" \
      -U "$POSTGRES_USER" \
      -W "$POSTGRES_PASSWORD" \
      --conf /usr/share/osm2pgrouting/mapconfig.xml \
      --clean
    echo "✅ 自動インポートが完了しました。"
else
    echo "ℹ️ 道路データは既に存在するか、ソースが見つからないためスキップします。"
fi