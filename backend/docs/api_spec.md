# バックエンドAPI仕様書

## 概要
このドキュメントでは、まもるナビで使用するバックエンドAPIの仕様をまとめる。

バックエンドでは、主に以下の機能を提供する。

* バックエンドの疎通確認
* ユーザーの現在地登録
* ユーザーの最新位置情報取得
* 避難所情報取得
* 避難所エリア判定
* 避難所ごとの人数集計
* 混雑度取得
* ヒートマップ用データ取得
* オフライン地図用データ取得
* 古い位置情報の削除

---

## 1. 現在地登録API

### エンドポイント
```txt
POST /locations/
```

### 概要
ユーザーの現在地情報を登録する。
ユーザーID、緯度、経度を受け取り、`user_locations` テーブルに保存する。

### リクエスト例
```json
{
  "user_id": "11111111-1111-1111-1111-111111111111",
  "latitude": 34.6937,
  "longitude": 135.5023
}
```

### レスポンス例
```json
{
  "message": "位置情報を受け取りました",
  "id": "026ef28b-1388-4a05-be97-4c9d0fdd9042",
  "user_id": "11111111-1111-1111-1111-111111111111",
  "latitude": 34.6937,
  "longitude": 135.5023,
  "recorded_at": "2026-06-01T05:03:14.000000"
}
```

---

## 2. 最新現在地取得API

### エンドポイント
```txt
GET /locations/{user_id}/latest
```

### 概要
指定したユーザーの最新の位置情報を取得する。
同じユーザーが複数回位置情報を送信している場合でも、最新の1件のみを返す。

### パスパラメータ
| パラメータ   | 型      | 説明     |
| ------- | ------ | ------ |
| user_id | string | ユーザーID |

### レスポンス例
```json
{
  "id": "026ef28b-1388-4a05-be97-4c9d0fdd9042",
  "user_id": "11111111-1111-1111-1111-111111111111",
  "latitude": 34.6937,
  "longitude": 135.5023,
  "recorded_at": "2026-06-01T05:03:14.000000"
}
```

---

## 3. 避難所一覧取得API

### エンドポイント
```txt
GET /shelters
```

### 概要
登録されている避難所一覧を取得する。
避難所ID、避難所名、住所、緯度、経度、収容人数を返す。

### レスポンス例
```json
{
  "shelters": [
    {
      "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
      "name": "テスト避難所",
      "address": "大阪府大阪市北区テスト1-1-1",
      "latitude": 34.6937,
      "longitude": 135.5023,
      "capacity": 100
    }
  ]
}
```

---

## 4. 避難所エリア判定API

### エンドポイント
```txt
GET /locations/{user_id}/area
```

### 概要
指定したユーザーの現在地が、避難所エリア内にいるかどうかを判定する。
避難所との距離を計算し、500m以内であれば `in_area` を `true` として返す。

### パスパラメータ
| パラメータ   | 型      | 説明     |
| ------- | ------ | ------ |
| user_id | string | ユーザーID |

### レスポンス例
```json
{
  "user_id": "11111111-1111-1111-1111-111111111111",
  "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
  "shelter_name": "テスト避難所",
  "distance_m": 0,
  "area_radius_m": 500,
  "in_area": true
}
```

---

## 5. 避難所ごとの人数集計API

### エンドポイント
```txt
GET /shelters/crowd-counts
```

### 概要
避難所ごとに、避難所エリア内にいるユーザー数を集計する。
混雑判定では、最終更新から5分以内の位置情報のみを対象とする。
同一ユーザーの位置情報が複数存在する場合は、最新の位置情報のみを使用する。

### レスポンス例
```json
{
  "crowd_counts": [
    {
      "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
      "shelter_name": "テスト避難所",
      "capacity": 100,
      "current_user_count": 1,
      "crowd_rate": 0.01,
      "crowd_level": "空きあり"
    }
  ]
}
```

---

## 6. ヒートマップ用データ取得API

### エンドポイント
```txt
GET /shelters/heatmap
```

### 概要
フロントエンドでヒートマップ表示に使用するデータを取得する。
避難所の緯度・経度、現在人数、混雑率、混雑度をまとめて返す。

### レスポンス例
```json
{
  "heatmap_data": [
    {
      "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
      "shelter_name": "テスト避難所",
      "latitude": 34.6937,
      "longitude": 135.5023,
      "capacity": 100,
      "current_user_count": 1,
      "crowd_rate": 0.01,
      "crowd_level": "空きあり"
    }
  ]
}
```

---

## 7. オフライン地図用データ取得API

### エンドポイント
```txt
GET /offline/map-data
```

### 概要
オフライン時に使用する避難所データを取得する。
通信可能なタイミングでフロントエンド側がこのAPIから避難所情報を取得し、端末に保存することで、オフライン時でも避難所一覧や地図上のピン表示に利用できる。

### レスポンス例
```json
{
  "shelters": [
    {
      "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
      "name": "テスト避難所",
      "address": "大阪府大阪市北区テスト1-1-1",
      "latitude": 34.6937,
      "longitude": 135.5023,
      "capacity": 100,
      "updated_at": null
    }
  ]
}
```

---

## 8. 古い位置情報削除API

### エンドポイント
```txt
DELETE /locations/old
```

### 概要
最終更新から一定時間以上経過した古い位置情報を削除する。
現在の仕様では、最終更新から5分以上経過した位置情報を古い情報として扱う。

### レスポンス例

```json
{
  "message": "古い位置情報を削除しました",
  "deleted_count": 3,
  "stale_minutes": 5
}
```

---

## 9. ヘルスチェックAPI

### エンドポイント
```txt
GET /health
```

### 概要
バックエンドが正常に起動しているかを確認するためのAPI。

### レスポンス例
```json
{
  "status": "ok",
  "message": "バックエンドは動いています"
}
```

### 使用用途
Docker起動後のバックエンド疎通確認
フロントエンドとの結合時のAPI接続確認

---

## 補足

### 位置情報の扱い

ユーザーの位置情報は、PostGISのPoint型として保存する。

距離計算では、`ST_DWithin` や `ST_Distance` を使用する。
メートル単位で距離を扱うために、必要に応じて `geography` 型へ変換して計算する。

### 混雑度の基準

混雑度は、現在人数と収容人数から算出した混雑率をもとに判定する。

| 混雑率       | 表示   |
| --------- | ---- |
| 0% 〜 49%  | 空きあり |
| 50% 〜 79% | やや混雑 |
| 80% 〜 99% | 混雑   |
| 100%以上    | 満員   |

| 条件 | crowd_rate | crowd_level |
| --- | --- | --- |
| capacity が 0 または未設定 | null | unknown |

---

## 関連仕様書

- `crowd_unit_policy.md`：混雑判定の単位に関する仕様
- `crowd_level_policy.md`：混雑度の判定基準に関する仕様


## 10. チェックイン作成API

### エンドポイント
```txt
POST /checkins/
```

### 概要
ユーザーが避難所にチェックインした記録を作成する。
チェックイン方法（QRコード、手動入力など）と備考を保存する。

### リクエスト例
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
  "method": "qr_code",
  "remarks": "家族3人で避難"
}
```

### レスポンス例
```json
{
  "message": "checkin created",
  "checkin_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## 11. ユーザー別チェックイン履歴取得API

### エンドポイント
```txt
GET /checkins/user/{user_id}
```

### 概要
指定したユーザーのすべてのチェックイン履歴を取得する。
チェックイン・チェックアウト時刻、同期状況、備考を含む。

### レスポンス例
```json
[
  {
    "checkin_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
    "checkin_time": "2026-06-22 09:00:00",
    "checkout_time": null,
    "method": "qr_code",
    "sync_status": "synced",
    "remarks": "家族3人で避難"
  }
]
```

---

## 12. 避難所別チェックイン一覧取得API

### エンドポイント
```txt
GET /checkins/shelter/{shelter_id}
```

### 概要
指定した避難所におけるすべてのチェックイン記録を取得する。
避難所側の管理画面で在所者一覧を確認する用途に使用する。

### レスポンス例
```json
[
  {
    "checkin_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
    "checkin_time": "2026-06-22 09:00:00",
    "checkout_time": null,
    "method": "qr_code",
    "sync_status": "synced"
  }
]
```

---

## 13. チェックアウトAPI

### エンドポイント
```txt
PATCH /checkins/{checkin_id}/checkout
```

### 概要
チェックイン中のユーザーを避難所からチェックアウトさせる。
既にチェックアウト済みの場合はエラーを返す。

### レスポンス例
```json
{
  "message": "checkout completed",
  "checkin_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## 14. 同期状況更新API

### エンドポイント
```txt
PATCH /checkins/{checkin_id}/sync
```

### 概要
オフライン環境で記録されたチェックインデータの同期状況を更新する。
サーバーとの同期が完了した際に使用する。

### レスポンス例
```json
{
  "message": "sync status updated",
  "sync_status": "synced"
}
```

---

## 15. 混雑スナップショット記録API

### エンドポイント
```txt
POST /congestion/
```

### 概要
避難所の混雑状況（空き・普通・満杯）を記録する。
データソースは手動入力・推定・センサーのいずれかを指定する。

### リクエスト例
```json
{
  "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
  "status": "moderate",
  "current_count": 45,
  "max_capacity": 100,
  "data_source": "manual"
}
```

### レスポンス例
```json
{
  "message": "snapshot created",
  "snapshot_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

---

## 16. 全避難所の最新混雑状況取得API

### エンドポイント
```txt
GET /congestion/
```

### 概要
全避難所それぞれの最新の混雑スナップショットを取得する。
ヒートマップやダッシュボード表示の基礎データとして使用する。

### レスポンス例
```json
[
  {
    "snapshot_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
    "status": "moderate",
    "current_count": 45,
    "max_capacity": 100,
    "data_source": "manual",
    "captured_at": "2026-06-22 09:30:00"
  }
]
```

---

## 17. 避難所別最新混雑状況取得API

### エンドポイント
```txt
GET /congestion/{shelter_id}/latest
```

### 概要
指定した避難所の直近の混雑スナップショットを1件取得する。
避難所詳細画面のリアルタイム表示に使用する。

### レスポンス例
```json
{
  "snapshot_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "shelter_id": "ebc1b1f7-b871-48d1-b551-69dba90129a5",
  "status": "moderate",
  "current_count": 45,
  "max_capacity": 100,
  "data_source": "manual",
  "captured_at": "2026-06-22 09:30:00"
}
```

---

## 18. 避難所混雑履歴取得API

### エンドポイント
```txt
GET /congestion/{shelter_id}
```

### 概要
指定した避難所の混雑スナップショットを時系列で取得する。
混雑の推移グラフ表示などに使用する。

### レスポンス例
```json
[
  {
    "snapshot_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "status": "moderate",
    "current_count": 45,
    "max_capacity": 100,
    "data_source": "manual",
    "captured_at": "2026-06-22 09:30:00"
  }
]
```

---

## 19. 危険エリア作成API

### エンドポイント
```txt
POST /danger-areas/
```

### 概要
火災・浸水・倒壊などの危険エリアをジオメトリ情報とともに登録する。
リスクレベルや発生トリガー条件も保存する。

### リクエスト例
```json
{
  "risk_type": "flood",
  "risk_level": 3,
  "intensity": "severe",
  "geom": "{\"type\":\"Polygon\",\"coordinates\":[[[135.50,34.69],[135.51,34.69],[135.51,34.70],[135.50,34.70],[135.50,34.69]]]}",
  "source": "weather_agency",
  "description": "河川氾濫による浸水想定エリア",
  "trigger_condition": "rainfall > 100mm/h",
  "is_active": true
}
```

### レスポンス例
```json
{
  "message": "danger area created",
  "area_id": "c3d4e5f6-a7b8-9012-cdef-123456789012"
}
```

---

## 20. 危険エリア一覧取得API

### エンドポイント
```txt
GET /danger-areas/
```

### 概要
登録されているすべての危険エリアを取得する。
`is_active` パラメータで有効なエリアのみに絞り込み可能。

### レスポンス例
```json
[
  {
    "area_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "risk_type": "flood",
    "risk_level": 3,
    "intensity": "severe",
    "source": "weather_agency",
    "description": "河川氾濫による浸水想定エリア",
    "trigger_condition": "rainfall > 100mm/h",
    "is_active": true,
    "created_at": "2026-06-22 08:00:00",
    "updated_at": "2026-06-22 08:00:00",
    "geom": "{\"type\":\"Polygon\",\"coordinates\":[[[135.50,34.69],[135.51,34.69],[135.51,34.70],[135.50,34.70],[135.50,34.69]]]}"
  }
]
```

---

## 21. 危険エリア詳細取得API

### エンドポイント
```txt
GET /danger-areas/{area_id}
```

### 概要
指定したIDの危険エリア詳細情報を取得する。
ジオメトリはGeoJSON形式で返される。

### レスポンス例
```json
{
  "area_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "risk_type": "flood",
  "risk_level": 3,
  "intensity": "severe",
  "source": "weather_agency",
  "description": "河川氾濫による浸水想定エリア",
  "trigger_condition": "rainfall > 100mm/h",
  "is_active": true,
  "created_at": "2026-06-22 08:00:00",
  "updated_at": "2026-06-22 08:00:00",
  "geom": "{\"type\":\"Polygon\",\"coordinates\":[[[135.50,34.69],[135.51,34.69],[135.51,34.70],[135.50,34.70],[135.50,34.69]]]}"
}
```

---

## 22. 危険エリア更新API

### エンドポイント
```txt
PATCH /danger-areas/{area_id}
```

### 概要
危険エリアの情報を部分更新する。
リスクレベルやジオメトリ、有効/無効状態などを変更可能。

### レスポンス例
```json
{
  "message": "danger area updated",
  "area_id": "c3d4e5f6-a7b8-9012-cdef-123456789012"
}
```

---

## 23. 危険エリア削除API

### エンドポイント
```txt
DELETE /danger-areas/{area_id}
```

### 概要
指定した危険エリアを削除する。
危険が解消された場合などに使用する。

### レスポンス例
```json
{
  "message": "danger area deleted",
  "area_id": "c3d4e5f6-a7b8-9012-cdef-123456789012"
}
```

---

## 24. 通知送信API

### エンドポイント
```txt
POST /notifications/
```

### 概要
ユーザーに緊急・警告・情報・通常の通知を送信する。
優先度（1〜3）と、関連する危険エリアIDを指定できる。

### リクエスト例
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "danger_area_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "type": "emergency",
  "priority": 3,
  "title": "避難勧告",
  "message": "近隣エリアで浸水の危険があります。直ちに避難してください。",
  "action_url": "/shelters/nearby"
}
```

### レスポンス例
```json
{
  "message": "notification created",
  "notification_id": "d4e5f6a7-b8c9-0123-defa-234567890123"
}
```

---

## 25. ユーザー通知一覧取得API

### エンドポイント
```txt
GET /notifications/user/{user_id}
```

### 概要
指定したユーザーが受信したすべての通知を、送信日時の降順で取得する。

### レスポンス例
```json
[
  {
    "notification_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "type": "emergency",
    "priority": 3,
    "title": "避難勧告",
    "message": "近隣エリアで浸水の危険があります。直ちに避難してください。",
    "is_read": false,
    "sent_at": "2026-06-22 10:00:00",
    "read_at": null,
    "action_url": "/shelters/nearby"
  }
]
```

---

## 26. 未読通知取得API

### エンドポイント
```txt
GET /notifications/user/{user_id}/unread
```

### 概要
指定したユーザーの未読通知のみを、優先度・送信日時の降順で取得する。
未読件数も合わせて返す。

### レスポンス例
```json
{
  "unread_count": 1,
  "notifications": [
    {
      "notification_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
      "type": "emergency",
      "priority": 3,
      "title": "避難勧告",
      "message": "近隣エリアで浸水の危険があります。直ちに避難してください。",
      "sent_at": "2026-06-22 10:00:00",
      "action_url": "/shelters/nearby"
    }
  ]
}
```

---

## 27. 通知既読化API

### エンドポイント
```txt
PATCH /notifications/{notification_id}/read
```

### 概要
指定した通知を既読状態にする。
既に既読の場合はその旨を返す。

### レスポンス例
```json
{
  "message": "通知が既読にマークされました",
  "notification_id": "d4e5f6a7-b8c9-0123-defa-234567890123"
}
```

---

## 28. 全通知既読化API

### エンドポイント
```txt
PATCH /notifications/user/{user_id}/read-all
```

### 概要
指定したユーザーの未読通知をすべて既読にする。
未読通知が存在しない場合はエラーを返す。

### レスポンス例
```json
{
  "message": "3 通知が既読にマークされました"
}
```

---

## 29. 施設予約作成API

### エンドポイント
```txt
POST /reservations/
```

### 概要
避難所内の施設（会議室、シャワー等）の予約を作成する。
開始時刻が終了時刻より前であることを検証する。

### リクエスト例
```json
{
  "facility_id": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "start_time": "2026-06-22T13:00:00",
  "end_time": "2026-06-22T14:00:00",
  "purpose": "授乳室として利用"
}
```

### レスポンス例
```json
{
  "message": "reservation created",
  "reservation_id": "f6a7b8c9-d0e1-2345-fabc-456789012345"
}
```

---

## 30. ユーザー別予約一覧取得API

### エンドポイント
```txt
GET /reservations/user/{user_id}
```

### 概要
指定したユーザーが行ったすべての施設予約を取得する。

### レスポンス例
```json
[
  {
    "reservation_id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "facility_id": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "start_time": "2026-06-22 13:00:00",
    "end_time": "2026-06-22 14:00:00",
    "status": "pending",
    "purpose": "授乳室として利用",
    "created_at": "2026-06-22 09:00:00"
  }
]
```

---

## 31. 施設別予約一覧取得API

### エンドポイント
```txt
GET /reservations/facility/{facility_id}
```

### 概要
指定した施設に対するすべての予約を取得する。
施設管理者が予約状況を確認する用途に使用する。

### レスポンス例
```json
[
  {
    "reservation_id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "start_time": "2026-06-22 13:00:00",
    "end_time": "2026-06-22 14:00:00",
    "status": "pending",
    "purpose": "授乳室として利用"
  }
]
```

---

## 32. 予約状況更新API

### エンドポイント
```txt
PATCH /reservations/{reservation_id}/status
```

### 概要
予約のステータス（pending, confirmed, canceled, completed）を更新する。

### リクエスト例
```json
{
  "status": "confirmed"
}
```

### レスポンス例
```json
{
  "message": "status updated",
  "reservation_id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
  "status": "confirmed"
}
```

---

## 33. 予約キャンセルAPI

### エンドポイント
```txt
DELETE /reservations/{reservation_id}
```

### 概要
予約をキャンセルする。
完了済み（completed）の予約はキャンセルできない。

### レスポンス例
```json
{
  "message": "reservation canceled",
  "reservation_id": "f6a7b8c9-d0e1-2345-fabc-456789012345"
}
```

---

## 34. 施設作成API

### エンドポイント
```txt
POST /facilities/
```

### 概要
避難所内に設置されている施設（会議室、シャワー等）を登録する。

### リクエスト例
```json
{
  "name": "多目的室A",
  "type": "meeting_room",
  "address": "大阪市中央区..."
}
```

### レスポンス例
```json
{
  "message": "facility created",
  "facility_id": "e5f6a7b8-c9d0-1234-efab-345678901234"
}
```

---

## 35. 施設一覧取得API

### エンドポイント
```txt
GET /facilities/
```

### 概要
登録されている全施設を取得する。
`type` パラメータで施設タイプによる絞り込みが可能。

### レスポンス例
```json
[
  {
    "facility_id": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "name": "多目的室A",
    "type": "meeting_room",
    "address": "大阪市中央区..."
  }
]
```

---

## 36. 施設詳細取得API

### エンドポイント
```txt
GET /facilities/{facility_id}
```

### 概要
指定したIDの施設の詳細情報を取得する。

### レスポンス例
```json
{
  "facility_id": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "name": "多目的室A",
  "type": "meeting_room",
  "address": "大阪市中央区..."
}
```

---

## 37. ユーザー作成API

### エンドポイント
```txt
POST /users/
```

### 概要
新規ユーザーを登録する。
自宅位置（緯度・経度）はPostGISのPOINT型として保存される。
メールアドレスまたは電話番号が既に登録済みの場合はエラーを返す。

### リクエスト例
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "gender": "male",
  "birthday": "1990-01-01",
  "phone_number": "090-1234-5678",
  "address": "大阪市中央区...",
  "user_role": "resident",
  "blood_type": "A",
  "medical_conditions": "なし",
  "longitude": 135.5023,
  "latitude": 34.6937
}
```

### レスポンス例
```json
{
  "message": "user created",
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## 38. ユーザー一覧取得API

### エンドポイント
```txt
GET /users/
```

### 概要
登録されている全ユーザーの一覧（ID・名前・メールアドレス）を取得する。

### レスポンス例
```json
[
  {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "山田太郎",
    "email": "yamada@example.com"
  }
]
```

---

## 39. ユーザーQRコード取得API

### エンドポイント
```txt
GET /users/qr-code
```

### 概要
ユーザーIDを埋め込んだQRコードコンテンツを生成する。
フロントエンドはこの文字列を使ってQRコード画像を生成する。

### レスポンス例
```json
{
  "qr_code_content": "mamoru_navi_user:123e4567-e89b-12d3-a456-426614174000",
  "message": "ユーザーIDに基づいたQRコードコンテンツを生成しました。"
}
```

---

## 40. ユーザー詳細取得API

### エンドポイント
```txt
GET /users/{user_id}
```

### 概要
指定したIDのユーザー詳細情報（年齢・血液型・既往症等を含む）を取得する。

### レスポンス例
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "山田太郎",
  "gender": "male",
  "birthday": "1990-01-01",
  "age": 36,
  "blood_type": "A",
  "medical_conditions": "なし",
  "phone_number": "090-1234-5678",
  "address": "大阪市中央区..."
}
```

---