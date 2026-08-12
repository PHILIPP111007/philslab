# ---------- СТАДИЯ СБОРКИ (builder) ----------
FROM node:24.11-alpine AS client

# В образе node:alpine уже есть непривилегированный пользователь 'node' (UID 1000)
# Мы будем использовать его, чтобы не работать от root.

WORKDIR /app

# Копируем только файлы с зависимостями для кэширования слоёв
COPY ./Frontend/react/app/package.json ./Frontend/react/app/package-lock.json ./

# Назначаем владельца рабочей директории пользователю 'node'
RUN chown -R node:node /app

# Переключаемся на непривилегированного пользователя
# USER node

# Устанавливаем зависимости:
#   - npm ci — быстрее и детерминированнее, чем npm install (использует lock-файл)
#   - отключаем аудит, фонды, прогресс-бар для уменьшения вывода
#   - используем временный кэш, который сразу чистим
RUN npm ci --no-audit --no-fund --no-progress --cache /tmp/npm-cache && \
    npm cache clean --force

# Копируем исходный код приложения (права доступа наследуются от владельца /app)
COPY ./Frontend/react/app/ .

# Устанавливаем NODE_ENV=production для оптимизации сборки (если нужно)
ENV NODE_ENV=production

# В production API доступен через nginx в том же origin: /api/v1 и /api/v2.
RUN VITE_DEVELOPMENT=0 VITE_PROD_FETCH_URL=/ npm run build

# ---------- ФИНАЛЬНЫЙ ОБРАЗ (nginx) ----------
FROM nginx:1.29.3-alpine

# Удаляем стандартную статику
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранные файлы из предыдущей стадии с явным указанием владельца (nginx)
# В образе nginx уже есть пользователь 'nginx' (UID 101)
COPY --from=client --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Удаляем конфиг по умолчанию и копируем свой
RUN rm /etc/nginx/conf.d/default.conf
COPY ./dockerfiles/react/nginx.conf /etc/nginx/conf.d/

# Убедимся, что конфиг доступен для чтения (по умолчанию права 644, этого достаточно)
# Можно дополнительно выставить права:
# RUN chmod 644 /etc/nginx/conf.d/nginx.conf

# Официальный образ nginx уже запускает процесс от пользователя nginx,
# поэтому дополнительная инструкция USER не требуется.
# Команда запуска остаётся стандартной:
CMD ["nginx", "-g", "daemon off;"]
