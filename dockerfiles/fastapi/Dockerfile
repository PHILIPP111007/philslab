# ----------------- СТАДИЯ СБОРКИ (builder) -----------------
FROM python:3.13.14-slim AS builder

# Устанавливаем системные пакеты, необходимые для компиляции (если они нужны)
# Например, для psycopg2 нужен gcc и libpq-dev
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Копируем только requirements.txt (чтобы закэшировать слой зависимостей)
COPY ./Services/fastapi/requirements.txt .

# Устанавливаем зависимости в отдельную директорию /install
# --no-cache-dir отключает кэш pip
# --prefix указывает, куда устанавливать пакеты
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ----------------- ФИНАЛЬНЫЙ ОБРАЗ -----------------
FROM python:3.13.14-slim

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

WORKDIR /app

# Копируем установленные пакеты из стадии сборки
COPY --from=builder --chown=appuser:appgroup /install /usr/local

# Копируем код приложения
COPY --chown=appuser:appgroup ./Services/fastapi/ .

# Переключаемся на непривилегированного пользователя
USER appuser

# Отключаем буферизацию вывода
ENV PYTHONUNBUFFERED=1
