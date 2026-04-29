# ベースとなる公式のPythonイメージを指定
FROM python:3.11

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係のファイルをコピーし、インストール
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# アプリケーションのソースコードをコピー
COPY ./app /app

# FastAPIを起動するコマンド
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]