# mamoru-navi

まもるナビのgit

まもるナビ 開発環境構築ガイド

このガイドでは、「まもるナビ」プロジェクトの開発環境を、Dockerを利用して構築し、開発を開始するまでの手順を説明します。チームメンバー全員が同じ環境で作業できるよう設計されています。

1. はじめに（必要なもの）

本プロジェクトの開発環境を構築するためには、以下のソフトウェアがPCにインストールされている必要があります。

- Git: ソースコードのバージョン管理ツール -[ ダウンロードはこちら](https://git-scm.com/install/)
- Docker Desktop: DockerコンテナをPC上で動かすためのソフトウェア
  - [ダウンロードはこちら](https://www.docker.com/products/docker-desktop/)
  - WSL 2 (Windows Subsystem for Linux 2) の有効化を推奨
    - WindowsユーザーはDocker
      Desktopのインストール時にWSL 2を有効にしてください。

2. プロジェクトのクローン

まず、GitHubからプロジェクトのソースコードをあなたのPCにダウンロードします。

1.  PC上の任意の場所に、プロジェクトを保存するためのフォルダ（例: Development）を作成します。
    推奨: WSL 2 (Windows Subsystem for Linux 2) 内
    おすすめの場所:(\\wsl.localhost\Ubuntu\home\あなたのLinuxユーザー名\Development)
2.  そのフォルダ内でターミナル（コマンドプロンプト、Git Bash、WSLのUbuntuなど）を開きます。
3.  以下のコマンドを実行して、GitHubからプロジェクトをクローンします。
    git clone https://github.com/2230217aya/mamoru-navi.git
4.  クローンが完了したら、作成されたプロジェクトフォルダに移動します。
    cd mamoru-navi

5.  Docker開発環境の構築と起動

プロジェクトのルートディレクトリ（mamoru-naviフォルダ直下）で、以下のコマンドを実行するだけで、バックエンド（Python/FastAPI）、フロントエンド（React
Native/Expo）、データベース（PostgreSQL/PostGIS）の3つの開発環境が自動的に構築・起動します。

1.  Docker環境の構築と起動
    初めての実行時、またはDockerfileやdocker-compose.ymlに変更があった場合は、以下のコマンドを使用します。コンテナイメージのダウンロードやビルドに時間がかかる場合があります。

    docker-compose up -d --build
    - -d: バックグラウンドでコンテナを起動します。
    - --build: Dockerfileに変更があった場合に、イメージを再ビルドします。

2.  （2回目以降の起動）Docker環境の起動 コンテナイメージがすでにPCに存在する場合や、開発を再開する際は、以下のコマンドで素早く起動できます。

    docker-compose up -d

3.  起動確認 以下のコマンドで、3つのサービス（backend, frontend, db）が正常に起動しているか確認できます。

    docker-compose ps

    Stateが全て Up になっていればOKです。

4.  サービスの動作確認

各サービスが正しく動いているか確認しましょう。

4.1 バックエンドAPI (FastAPI) の確認

1.  Webブラウザを開き、以下のURLにアクセスします。 http://localhost:8000/
2.  ブラウザに {"message": "まもるナビ APIへようこそ！"} と表示されれば、バックエンドAPIは正常に稼働しています。

4.2 データベース (PostgreSQL/PostGIS) の確認

データベースへの接続は、SQLクライアント（DBeaver, TablePlusなど）や、Dockerコンテナ内から行えます。

1.  コンテナ内からの接続例: まず、データベースコンテナの中に入ります。
    docker-compose exec db bash
    次に、PostgreSQLに接続します（パスワードはuserです）。
    psql -U user -d mamoru_navi_db
    プロンプトが mamoru_navi_db=# になれば接続成功です。\q で終了します。

4.3 フロントエンド (React Native / Expo) の起動

1. Dockerコンテナを起動する
   docker-compose up -d

2. 依存ライブラリをインストールする（Unable to find expoエラーが出る場合）
   docker-compose exec frontend npm install

3. 開発サーバーを起動する
   Docker/WSL環境では、ネットワーク制限を回避するために --tunnel オプションを推奨します。

   docker-compose exec frontend npx expo start --tunnel

   初回実行時に @expo/ngrok のインストールを求められたら y を入力してください。
   ターミナルに表示された QRコード をスマホの「Expo Go」アプリで読み込むと、実機でプレビュー可能です。

4. 開発の進め方

- ソースコードの編集: VSCodeなどのエディタで、backend/app や frontend
  フォルダ内のファイルを直接編集します。volumes設定により、変更はリアルタイムでコンテナに同期されます。
- バックエンドの自動リロード:
  backend/Dockerfileのuvicornコマンドに--reloadオプションが含まれているため、Pythonファイルへの変更は自動的にAPIに反映されます。
- フロントエンドのホットリロード: expo startで起動した開発サーバーは、ファイルの変更を検知して自動的にアプリに反映します。
- Gitの利用:
  - 機能ごとに新しいブランチを作成し（git checkout -b feature/your-feature）、作業を進めます。
  - 変更をコミットし（git add . -> git commit -m "コミットメッセージ"）、定期的にGitHubにプッシュ（git
    push origin feature/your-feature）します。
  - 作業が完了したら、mainブランチへのプルリクエストを作成し、チームメンバーとコードレビューを行います。

6. 開発終了時

作業を終える際は、以下のコマンドでコンテナを停止します。

docker-compose down

- downコマンドは、起動していたコンテナを停止・削除します。volumesで指定したpostgres_dataは削除されないため、DBのデータは保持されます。

トラブルシューティング

- docker-compose upでエラーが出る場合:
  - Docker Desktopが起動しているか確認してください。
  - ターミナルがプロジェクトのルートディレクトリ（mamoru-navi）にいるか確認してください。
  - エラーメッセージをコピーして検索すると解決策が見つかりやすいです。
- frontendコンテナでnpm installが動かない場合:
  - node_modulesのパーミッション問題の可能性があります。コンテナ内でnpm installを直接実行してみてください。
- WSLでsafe.directoryエラーが出る場合:
  - WSLのターミナルで git config --global --add safe.directory '\*' を実行してください。

7. 開発ルール：ファイル作成の規約
   「まもるナビ」プロジェクトでは、コードの可読性、保守性、そしてチームメンバー間の認識統一を目的として、以下のファイル作成・命名規則を定めています。

1. 基本的な命名規則
   ファイル名:
   すべて小文字で記述します。（例: my-page.tsx）
   単語間はハイフン (-) で繋ぎます。（例: offline-data-management.tsx）
   React Native Component としてエクスポートする関数名も、ファイル名に合わせて PascalCase にします。（例: MyPageScreen, OfflineDataScreen）

フォルダ名:
すべて小文字で記述します。
単語間はハイフン (-) で繋ぎます。（例: screens, components, api/v1）
Expo Router のルーティングでは、(tabs) のように丸括弧で囲むことで、タブナビゲーションのグループとして認識させます。

コンポーネント名:
React Component としてエクスポートする関数は、PascalCase で記述します。（例: MyPageScreen, PrimaryButton）

2. ファイル配置の規約
   「まもるナビ」プロジェクトでは、コードの可読性、保守性、そしてチームメンバー間の認識統一を目的として、以下のファイル作成・命名規則を定めています。
   基本的な命名規則:
   ファイル名・フォルダ名: すべて小文字で、単語間はハイフン (-) で繋ぎます。（例: my-page.tsx, offline-data, api/v1）
   React Component 名: PascalCase で記述します。（例: MyPageScreen, ThemedText）
   app/ フォルダ: Expo Router のルーティング構造を定義する場所です。
   ファイル名がURLパスになります: app フォルダ直下の .tsx ファイルは、そのファイル名がそのままURLパスになります。
   app/index.tsx →→ / (アプリ起動時のデフォルトルート)
   app/my-page.tsx →→ /my-page
   app/profile-edit.tsx →→ /profile-edit
   app/dashboard.tsx →→ /dashboard

フォルダによるグループ化:
app/(tabs)/ のように丸括弧で囲まれたフォルダは、タブナビゲーションのグループとして扱われます。
このグループ内の index.tsx が、そのタブのデフォルト画面になります。
グループ内の他のファイル (my-page.tsx, offline-data.tsx など) は、タブメニューに表示される各画面に対応します。

\_layout.tsx ファイル:
app/ フォルダ直下にある \_layout.tsx は、そのフォルダ内の画面群の「レイアウト」や「ナビゲーション構造」を定義します。
app/(tabs)/\_layout.tsx では、タブナビゲーション (createBottomTabNavigator のようなもの) を定義し、Tabs.Screen で各タブ画面 (index, my-page, offline-data など) を登録します。
app/\_layout.tsx（app フォルダ直下）では、スタックナビゲーション (createStackNavigator のようなもの) を定義し、initialRouteName でアプリ起動時の最初の画面を指定します。

src/ フォルダ:
UIコンポーネント本体 (screens/) や、再利用可能な部品 (components/)、カスタムHooks (hooks/)、ユーティリティ関数 (utils/) などを、ルーティング構造とは切り離して一元管理します。
app/ フォルダからの参照: app/ フォルダ内のファイルから src/ フォルダ内のファイルをインポートする際は、app フォルダを起点とした相対パスで指定します。（例: import MyPageScreen from '../src/screens/MyPageScreen';）

assets/ フォルダ:
画像ファイル (images/) やフォントファイル (fonts/) などを配置します。

3. Gitでのコミット規約
   ブランチ名: 機能追加は feat/XXX、バグ修正は fix/XXX、リファクタリングは refactor/XXX のように、プレフィックスを付けて分かりやすくします。（例: feat/frontend-myqr）
   コミットメッセージ: 以下の形式で、変更内容を明確に記述します。
   [Type]: [Subject]
   [Body (Optional)]
   Why: [変更理由]
   How: [変更内容の詳細]

Type: feat, fix, docs, style, refactor, test, chore など。
Subject: 変更内容の簡潔な要約（命令形が望ましい）。
Body: 変更の背景や詳細な説明（必須ではない）。

(例)
git add .

git commit -m "feat: QRコード表示機能を実装

Why: ユーザーが自身のQRコードを確認できるようにするため
How: MyPageScreenコンポーネントにQRCodeライブラリを組み込み、ダミーデータを表示
"

[新しいファイル作成時の具体的な手順例]
例1：新しい「設定」画面をタブに追加したい場合
UIコードを作成: frontend/src/screens/SettingsScreen.tsx にUIコードを書く。
App.tsx/\_layout.tsxでタブ設定:
frontend/app/\_layout.tsx を開く。
Tabs.Screen に name="settings" を追加し、component に () => import('../src/screens/SettingsScreen').default のような形でコンポーネントを渡す。（Expo Router の動的インポートを使うと、\_layout.tsx を gọn gàng に保てます。もしくは、app/settings.tsx を作成し、その中にUIコードをコピー＆ペーストします。後者の方がExpo Routerの規約には忠実です。）
（推奨）app/settings.tsx を作成: frontend/src/screens/SettingsScreen.tsx の中身を、frontend/app/settings.tsx にコピー＆ペーストまたはラップ(推奨)し、export default function SettingsScreen() { ... } のようにします。
\_layout.tsx の Tabs.Screen では、name="settings" と component={SettingsScreen as any} を設定します。
Gitにコミット: git add . → git commit -m "feat: add settings tab" → git push
例2：QRコード画面の「個人情報編集」ボタンから遷移する画面を作成したい場合
UIコードを作成: frontend/src/screens/ProfileEditScreen.tsx にUIコードを書く。
app/profile-edit.tsx を作成: frontend/app/profile-edit.tsx に、src/screens/ProfileEditScreen.tsx のUIコードをインポートしてラップする形で作成する。（前回の例を参照）
遷移元（MyPageScreen）でのrouter.push修正: frontend/app/my-page.tsx の「個人情報編集」ボタンの onPress を router.push('/profile-edit') に修正する。
Gitにコミット: git add . → git commit -m "feat: add profile edit screen and navigation" → git push

API接続設定（フロントエンド ⇄ バックエンド）

本プロジェクトでは、開発環境（PC）で動作しているAPIサーバーに、実機（スマホ）から接続する必要があります。ネットワーク環境に合わせて、以下の 【パターンA】
または 【パターンB】 のいずれかを選択してください。

⚠️ 事前準備（共通）

frontend フォルダ直下に .env ファイルを作成し、APIのベースURLを定義してください。 ※ .env を書き換えた後は、必ず Expo
サーバーを再起動（Ctrl+C \rightarrow 再起動）してください。

【パターンA】 LAN直結モード（推奨：高速・安定）

PCの「モバイルホットスポット」機能を使用し、スマホとPCを直接接続する方法です。外部サーバーを経由しないため、動作が非常に高速で安定します。

1. 接続手順

- Windows の「モバイル ホットスポット」を ON にする。
- スマホの Wi-Fi 設定で、PCが飛ばしている Wi-Fi に接続する。

2. .env の設定 .env ファイルに以下を記述してください（PCのホットスポットIPアドレスを指定）。

EXPO_PUBLIC_API_URL=http://192.168.137.1:8000

3. 起動コマンド

docker-compose exec frontend env REACT_NATIVE_PACKAGER_HOSTNAME=192.168.137.1 npx expo start --host lan --port 19000

【パターンB】 Localtunnelモード（柔軟：ネットワーク制限がある場合）

学校や企業のWi-Fiなど、端末同士の直接通信が禁止されている環境で使用する方法です。インターネット経由でAPIにアクセスします。

1. APIトンネルの起動 別のターミナルを開き、以下のコマンドでAPIを外部公開します。

# --subdomain には自分専用のユニークな名前をつけてください

npx localtunnel --port 8000 --subdomain mamoru-navi-api-aya223

表示された URL（https://mamoru-navi-api-aya223.loca.lt）をコピーします。

2. .env の設定 .env ファイルに、コピーしたURLを記述してください。

EXPO_PUBLIC_API_URL=https://mamoru-navi-api-aya223.loca.lt

3. 起動コマンド

docker-compose exec frontend npx expo start --tunnel

💡 注意点（Localtunnel使用時）

- 警告画面の回避: APIリクエストのヘッダーに 'Bypass-Tunnel-Reminder': 'true'
  を含める必要があります（コード内で実装済み）。
- ブラウザでの事前承諾: 初回アクセス時のみ、スマホのブラウザで一度 URL を開き、「Click to
  Continue」ボタンを押して接続を許可してください。

🛠 接続確認チェックリスト

もし API 通信で Network request failed が出る場合は、以下を確認してください。

- [ ] .env の URL は正しいか？
- [ ] .env 書き換え後、Expo サーバーを再起動したか？
- [ ] Windows ファイアウォールが OFF になっているか？（特にパブリックネットワーク）
- [ ] （パターンAの場合）スマホが PC のホットスポットに接続されているか？
- [ ] （パターンBの場合）localtunnel コマンドを起動し続けているか？
