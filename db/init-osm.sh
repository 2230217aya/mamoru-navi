#!/bin/bash
set -e

# 設定
TARGET_OSM="/tmp/workdir/osaka_city.osm"
SOURCE_PBF="/tmp/kinki-latest.osm.pbf"

# 1. すでにインポート済みか確認
# ※ count(*) を見ることで、テーブルはあるが中身が空というケースも防げます
TABLE_EXISTS=$(psql -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ways');")

if [ "$TABLE_EXISTS" = "t" ]; then
    # テーブルが存在する場合のみ、中身があるか数える
    ROW_COUNT=$(psql -tAc "SELECT count(*) FROM ways;")
    if [ "$ROW_COUNT" -gt 0 ]; then
        echo "✅ 道路データは既に存在し、${ROW_COUNT}件のレコードがあります。処理を終了します。"
        exit 0
    else
        echo "⚠️  waysテーブルはありますが、中身が空のためインポートを続行します。"
    fi
else
    echo "🆕 waysテーブルが存在しません。新規インポートを開始します。"
fi

echo "🚀 本格的なOSMデータ構築を開始します..."

# 2. 大阪エリアの抽出
if [ ! -f "$TARGET_OSM" ]; then
    echo "📍 大阪エリアを抽出中..."
    # 以前の実行で壊れたファイルが残っている可能性を考え、一時ファイルを使ってからrenameするのが安全
    osmconvert "$SOURCE_PBF" -b=135.47,34.67,135.53,34.73 -o="$TARGET_OSM"
fi

# 3. インポート実行
echo "🚗 道路ネットワークをインポート中..."
# --clean で osm2pgrouting 以前のテーブルを掃除
osm2pgrouting \
  -f "$TARGET_OSM" \
  -d "$PGDATABASE" \
  -U "$PGUSER" \
  -W "$PGPASSWORD" \
  -h "$PGHOST" \
  --conf /usr/share/osm2pgrouting/mapconfig.xml \
  --clean

# 4. データベースの後処理
echo "🗺️ トポロジーとインデックスを構築します..."

psql -v ON_ERROR_STOP=1 -c "
  -- トポロジー作成 (clean := false に変更)
  -- osm2pgroutingが既にテーブルを作っているので、中身を足すだけで良い
  SELECT pgr_createTopology('ways', 0.0001, 'the_geom', 'gid', 'source', 'target', clean := false);
  
  -- 距離（コスト）の更新
  UPDATE ways SET length = ST_Length(the_geom::geography);
  
  -- インデックスの作成
  CREATE INDEX IF NOT EXISTS ways_the_geom_idx ON ways USING GIST (the_geom);
  CREATE INDEX IF NOT EXISTS ways_source_idx ON ways (source);
  CREATE INDEX IF NOT EXISTS ways_target_idx ON ways (target);

  -- グラフの解析（任意：ログ確認用）
  SELECT pgr_analyzeGraph('ways', 0.0001, 'the_geom', 'gid', 'source', 'target');
"

echo "✨ 全ての工程が正常に完了しました！"