FROM python:3.11.3-slim-bullseye as python-base

# 作業ディレクトリを設定
WORKDIR /app

# 必要な依存ツールをインストール
# pip, poetry, ビルドツールをインストール
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Poetryのインストール
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# # Poetryの仮想環境を無効化 (Docker内ではホストのPython環境を直接使用)
RUN poetry config virtualenvs.create false

# Pythonの依存関係をコピー
COPY pyproject.toml poetry.lock ./

# Poetryで依存関係をインストール
RUN poetry install --no-root

# アプリケーションコードをコピー
COPY . .

# サーバーポートを公開
EXPOSE 6001

# アプリケーションを実行
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "6001", "--reload"]
# CMD ["python3", "main.py"]
