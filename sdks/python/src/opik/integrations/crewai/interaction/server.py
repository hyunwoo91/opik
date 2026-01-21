import logging
import time
import uuid
from collections.abc import Iterable
from typing import Any, Dict, List, Optional

from crewai import CrewOutput
from crewai.types.streaming import CrewStreamingOutput
from openai.types.chat import ChatCompletionMessageParam, ChatCompletionAssistantMessageParam

from .common import InputMapper, OutputMapper

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict

LOGGER = logging.getLogger(__name__)


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatCompletionMessageParam]
    stream: bool = False

    model_config = ConfigDict(extra='allow')


class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatCompletionMessageParam
    logprobs: Optional[Any] = None
    finish_reason: str = "stop"


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    usage: Optional[Dict[str, int]] = None


class OpenAICompatibleServer:
    def __init__(
            self,
            target: Any,
            input_mapper: InputMapper = None,
            output_mapper: OutputMapper = None,
    ):
        """
        Initialize the OpenAI Compatible Server.

        Args:
            target: The CrewAI component (Crew, Flow) to interact with.
        """
        def default_input_mapper(messages: Iterable[ChatCompletionMessageParam]) -> Dict[str, Any]:
            user_msg = next(msg for msg in reversed(list(messages)) if msg["role"] == "user")
            try:
                import json
                return json.loads(user_msg["content"])
            except Exception:
                return {"user": user_msg["content"]}

        def default_output_mapper(output: CrewOutput | CrewStreamingOutput) -> str:
            # TODO
            if isinstance(output, CrewStreamingOutput):
                raise ValueError("Streaming output is not supported yet.")
            return output.raw

        self.input_mapper = input_mapper or default_input_mapper
        self.output_mapper = output_mapper or default_output_mapper

        self.target = target
        from fastapi.middleware.cors import CORSMiddleware
        self.app = FastAPI()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        self.setup_routes()

    def setup_routes(self):
        @self.app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
        async def chat_completions(request: ChatCompletionRequest):
            LOGGER.info(f"Received chat completion request: {request}")

            opik_args = request.model_extra["opik_args"] \
                if request.model_extra and "opik_args" in request.model_extra \
                else None

            # Process with CrewAI target
            try:
                response_content = self._process_request(
                    request.messages,
                    opik_args=opik_args,
                )
            except Exception as e:
                LOGGER.error(f"Error processing request: {e}", exc_info=True)
                raise HTTPException(status_code=500, detail=str(e))

            # Construct response
            message: ChatCompletionAssistantMessageParam = {
                "role": "assistant",
                "content": response_content,
            }
            return ChatCompletionResponse(
                id=f"chatcmpl-{uuid.uuid4()}",
                created=int(time.time()),
                model=request.model,
                choices=[
                    ChatCompletionChoice(
                        index=0,
                        message=message,
                    )
                ],
            )

    def _process_request(self, user_message: List[ChatCompletionMessageParam], opik_args: Dict[str, Any] = None) -> str:
        """
        Process the user message using the CrewAI target.
        """
        # Determine the type of target and call appropriate method
        # This is a heuristic approach based on typical CrewAI usage

        # Use the mapper to get the inputs
        inputs = self.input_mapper(user_message)

        # Check if it's a Crew
        if hasattr(self.target, "kickoff"):
            # Assuming kickoff takes 'inputs' dict
            result = self.target.kickoff(inputs=inputs, opik_args=opik_args)
            return str(result)
        else:
            raise ValueError("Target must have a kickoff method")        

    def run(self, host: str, port: int):
        uvicorn.run(self.app, host=host, port=port)
