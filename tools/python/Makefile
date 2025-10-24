VENV_NAME?=venv
PIP?=pip
PYTHON?=python3.11
DEFAULT_TEST_ENV?=py311

venv: $(VENV_NAME)/bin/activate

$(VENV_NAME)/bin/activate: requirements.txt
	@test -d $(VENV_NAME) || $(PYTHON) -m venv --clear $(VENV_NAME)
	${VENV_NAME}/bin/python -m pip install -r requirements.txt
	@touch $(VENV_NAME)/bin/activate

test: venv
	${VENV_NAME}/bin/python -m unittest discover tests

build: venv
	cp ../LICENSE LICENSE
	${VENV_NAME}/bin/python -m build
	rm LICENSE
