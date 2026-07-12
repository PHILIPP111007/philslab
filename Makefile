# Variables
FASTAPI_DIR = Services/fastapi/
DJANGO_DIR = Services/django
REACT_DIR = Frontend/react/app/

create_env:
	cd $(FASTAPI_DIR) && \
	python3 -m venv .venv && \
	source ./.venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt

	cd $(DJANGO_DIR) && \
	python3 -m venv .venv && \
	source ./.venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt

	cd $(REACT_DIR) && \
	npm install

update_js_env:
	cd $(REACT_DIR) && \
	sudo npm update

test:
	@echo "Starting fastapi tests..."
	cd $(FASTAPI_DIR) && \
	source ./.venv/bin/activate && \
	export TESTING=1 && \
	pytest -v

django:
	@echo "Starting django..."
	cd $(DJANGO_DIR) && \
	source ./.venv/bin/activate && \
	export DEVELOPMENT=1 && \
	export DEBUG=1 && \
	python manage.py makemigrations && \
	python manage.py migrate && \
	uvicorn settings.asgi:application --host localhost --port 8000 --workers 1 --reload --loop uvloop

fastapi:
	@echo "Starting fastapi..."
	cd $(FASTAPI_DIR) && \
	source ./.venv/bin/activate && \
	export DEVELOPMENT=1 && \
	export TESTING=0 && \
	python run.py

react:
	@echo "Starting react..."
	cd $(REACT_DIR) && \
	VITE_DEVELOPMENT=1 VITE_PROD_SERVER_HOST=0.0.0.0 VITE_PROD_SERVER_PORT=80 npm run dev
