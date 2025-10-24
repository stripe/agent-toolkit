from os import getenv

from dotenv import load_dotenv

# Load the environment
load_dotenv()


def ensure(name: str) -> str:
    var = getenv(name)
    if not var:
        raise ValueError(f"Missing '{name}' environment variable")
    return var


def get_or(name: str, default: str) -> str:
    var = getenv(name)
    if not var:
        return default
    return var
