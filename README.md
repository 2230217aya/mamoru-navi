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

4.3 フロントエンド (React Native / Expo) の準備と起動（初回のみ）

フロントエンドコンテナは、初回起動時にReact Nativeプロジェクトの初期化が必要です。

1.  フロントエンドコンテナに入る

    docker-compose exec frontend bash

2.  React Nativeプロジェクトの初期化
    - コンテナ内で以下のコマンドを実行します。対話形式でプロジェクト名などを聞かれますが、blank (TypeScript)
      を選択し、プロジェクト名も . (ドット)
      で現在のディレクトリに作成するように指定してください。

    expo init .
    - 初期化が完了したら、Ctrl+D または exit と入力してコンテナから抜けます。

3.  フロントエンドの開発サーバー起動 プロジェクトのルートディレクトリ（mamoru-navi/）で、以下のコマンドを実行します。

    docker-compose exec frontend npx expo start --host 0.0.0.0
    - これにより、Expo開発サーバーが起動し、ターミナルにQRコードが表示されます。
    - お手持ちのスマートフォンに「Expo Go」アプリをインストールし、このQRコードを読み込むと、スマホでアプリがプレビューできます。

4.  開発の進め方

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

このREADMEの内容をGitHubのリポジトリに貼り付ければ、チームメンバーは迷うことなく開発環境を構築できるはずです。
