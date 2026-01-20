from collections.abc import Iterable
from typing import Any, Dict, Callable, Union
from enum import Enum

from crewai import CrewOutput
from crewai.types.streaming import CrewStreamingOutput
from openai.types.chat import ChatCompletionMessageParam


class InteractMode(Enum):
    CHAT = "chat"


InputMapper = Callable[[Iterable[ChatCompletionMessageParam]], Dict[str, Any]]
OutputMapper = Callable[[CrewOutput | CrewStreamingOutput], str]
