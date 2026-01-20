import logging
import os

import requests
from typing import Optional, Any

from crewai import Crew, Flow

from .common import InteractMode, InputMapper, OutputMapper
from .server import OpenAICompatibleServer
from ..opik_tracker import track_crewai

LOGGER = logging.getLogger(__name__)


def interact_crewai_as_chat(
        target: Any,
        name: Optional[str] = None,
        host: str = "127.0.0.1",
        port: int = 8000,
        input_mapper: Optional[InputMapper] = None,
        output_mapper: Optional[OutputMapper] = None,
        should_tracking = True,
) -> None:
    """
    Serve a CrewAI component (Agent, Crew, Flow) as an OpenAI-compatible chat service
    and register it with the Opik backend.

    Args:
        target: The CrewAI component to serve.
        name: The name of the service. If None, uses the target's class name.
        host: The host to bind the server to.
        port: The port to bind the server to.
        input_mapper: A function to map user input to the CrewAI component's input format.
        output_mapper: A function to map CrewAI component output to the expected OpenAI response format.
        should_tracking: Whether to track the CrewAI component with Opik.
    """
    if name is None:
        name = type(target).__name__

    _register_service(name, host, port, InteractMode.CHAT)
    if should_tracking:
        crew = target if isinstance(target, Crew) else None
        track_crewai(
            project_name=name,
            crew=crew,
        )

    LOGGER.info(f"Starting Interactive CrewAI Service '{name}' at http://{host}:{port}")
    server = OpenAICompatibleServer(target, input_mapper, output_mapper)
    server.run(host=host, port=port)


def _register_service(name: str, host: str, port: int, target_as: InteractMode) -> None:
    """
    Register the chat service with the Opik backend.
    """
    opik_base_url = os.environ.get("OPIK_URL_OVERRIDE")
    if not opik_base_url:
        raise ValueError("`opik_base_url` is required to register a service. Set `OPIK_URL_OVERRIDE`")

    registration_url = f"{opik_base_url.rstrip('/')}/v1/private/debug/connections"
    payload = {
        "name": name,
        "url": f"http://{host}:{port}",
        "type": "crewai",
        "target_as": target_as.value,
    }
    
    LOGGER.info(f"Registering service at {registration_url} with payload: {payload}")
    
    try:
        # We use a short timeout because if the backend doesn't support it or is down,
        # we don't want to block startup for too long, but we should probably log a warning.
        # Since it's a placeholder, it will likely 404.
        response = requests.post(registration_url, json=payload, timeout=5)
        if response.status_code in [200, 201]:
             LOGGER.info("Service registered successfully.")
        else:
             LOGGER.warning(f"Failed to register service. Status: {response.status_code}, Response: {response.text}")
             # We don't raise an exception here because the user told us the endpoint doesn't exist yet,
             # so we expect failure (404), but we want the server to run anyway.
    except Exception as e:
        LOGGER.warning(f"Error registering service: {e}")
