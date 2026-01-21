
import threading
import time
import requests
import logging

from crewai import Agent, Task, Crew, Process

from opik.integrations.crewai import interact_crewai_as_chat

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GreetingCrew:
    def __init__(self, stream: bool = False, model: str = "gpt-4o"):
        self.stream = stream
        self.model = model

    def dummy_agent(self) -> Agent:
        return Agent(
            role="유저에게 인사하기",
            goal="반갑게 인사를 한다.",
            backstory="너는 인사를 잘하는 에이전트다.",
            llm=self.model,
            verbose=True,
            allow_delegation=True,
        )

    def dummy_task(self) -> Task:
        return Task(
            description="유저와 대화를 한다.\n유저: {user}",
            expected_output="자연스러운 응답",
            agent=self.dummy_agent(),
        )

    def crew(self) -> Crew:
        return Crew(
            agents=[
                self.dummy_agent()
            ],
            tasks=[
                self.dummy_task()
            ],
            process=Process.sequential,
            verbose=True,
            stream=self.stream,
        )

def test_interactive_crewai():
    crew = GreetingCrew().crew()
    serving_host = "127.0.0.1"
    serving_port = 8888

    # Run interact_crewai in a separate thread because it blocks
    def run_server():
        try:
            interact_crewai_as_chat(
                target=crew,
                name="test-crew-service",
                host=serving_host,
                port=serving_port,
            )
        except Exception as e:
            logger.error(f"Server failed: {e}")

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give it a moment to start
    time.sleep(10)
    
    # Test the chat completions endpoint
    url = f"http://{serving_host}:{serving_port}/v1/chat/completions"
    payload = {
        "model": "gpt-4",
        "messages": [{"role": "user", "content": "Hello Crew!"}]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        logger.info(f"Response Status: {response.status_code}")
        logger.info(f"Response Body: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        print(f"Response: {data['choices'][0]['message']['content']}")
        print("✅ Verification Successful: Server responded correctly.")
        
    except Exception as e:
        logger.error(f"Verification Failed: {e}")
        raise

if __name__ == "__main__":
    crew = GreetingCrew().crew()
    serving_host = "127.0.0.1"
    serving_port = 8888

    interact_crewai_as_chat(
        target=crew,
        name="test-crew-service",
        host=serving_host,
        port=serving_port,
    )
