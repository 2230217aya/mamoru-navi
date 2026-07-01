#!/bin/bash
set -e

OSM_FILE="/tmp/osaka_city.osm"
PBF_FILE="/tmp/kinki-latest.osm.pbf"

# ① 道路データ(ways)がまだ無い場合のみ実行するロジック
TABLE_EXISTS=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ways');")

if [ "$TABLE_EXISTS" = "f" ]; then
    echo "📍 道路データの構築を開始します..."
    
    # 範囲を絞って .osm に変換
    if [ ! -f "$OSM_FILE" ] && [ -f "$PBF_FILE" ]; then
        osmconvert "$PBF_FILE" -b=135.35,34.58,135.65,34.78 -o="$OSM_FILE"
    fi

    # pgRoutingデータのインポート
    osm2pgrouting \
      -f "$OSM_FILE" -d "$POSTGRES_DB" -U "$POSTGRES_USER" -W "$POSTGRES_PASSWORD" \
      --conf /usr/share/osm2pgrouting/mapconfig.xml --clean

    # ② あなたが手動で打った「Topology作成」もここに組み込む！
    echo "🗺️  トポロジー(接続情報)を生成中..."
    # clean := false に変更し、既存のテーブルを壊さずに実行する
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT pgr_createTopology('ways', 0.0001, 'the_geom', 'gid', 'source', 'target', rows_where := 'true', clean := false);"
    
    
    # 成功したか確認するためのチェックを追加
    # source または target が 0 (未接続) でないレコード数を表示
    echo "📊 接続状況の確認:"
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT count(*) as connected_ways FROM ways WHERE source IS NOT NULL;"

    
    echo "✅ 道路ネットワークの構築が完了しました。"
else
    echo "ℹ️  道路データ(ways)は既に存在するためスキップします。"
fi