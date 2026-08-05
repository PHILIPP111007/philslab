FROM python:3.13.14-slim

# Обновляем список пакетов и устанавливаем только необходимые системные зависимости
# (если они нужны — оставьте только то, что действительно требуется)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # пример: gcc, libpq-dev, ... (добавьте по необходимости)
    && rm -rf /var/lib/apt/lists/*

# Создаём группу и непривилегированного пользователя с фиксированными UID/GID
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

WORKDIR /app

# Копируем только файл с зависимостями для кэширования слоя
COPY ./Services/fastapi/requirements.txt .

# Обновляем pip и устанавливаем зависимости без сохранения кэша
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем остальной код (pyproject.toml и содержимое Services/fastapi)
COPY ./Services/fastapi/ .

# Назначаем владельца всех файлов в /app созданному пользователю
RUN chown -R appuser:appgroup /app

# Переключаемся на непривилегированного пользователя
USER appuser

# Отключаем буферизацию вывода (безопасность + логирование)
ENV PYTHONUNBUFFERED=1
