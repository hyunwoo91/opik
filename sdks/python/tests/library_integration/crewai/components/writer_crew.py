from crewai import Agent, Task, Crew, Process, LLM, BaseLLM
from crewai.tools import tool

# 1. 더미 도구 정의 (함수형 도구)
@tool("web_search_tool")
def web_search_tool(query: str):
    """웹에서 정보를 검색하는 척하는 도구입니다."""
    return f"'{query}'에 대한 웹 검색 결과: 최근 뉴로심볼릭 AI가 딥러닝의 한계를 극복할 대안으로 떠오르고 있음."

@tool("trend_analysis_tool")
def trend_analysis_tool(topic: str):
    """최신 트렌드 지수를 확인하는 척하는 도구입니다."""
    return f"'{topic}' 트렌드 지수: 85점 (전월 대비 12% 상승, 매우 높음)"

@tool("draft_outline_tool")
def draft_outline_tool(content: str):
    """글의 개요를 짜주는 도구입니다."""
    return f"제공된 내용을 바탕으로 '서론-본론-결론'의 3단 구성 개요를 생성함."

@tool("style_check_tool")
def style_check_tool(text: str):
    """문체를 다듬어주는 도구입니다."""
    return f"문장을 더 전문적이고 부드러운 말투로 교정 완료함."


class WritingCrew:
    def __init__(self, stream: bool = False, model: str = "gpt-5.1"):
        self.stream = stream
        self.model = model

    def researcher(self) -> Agent:
        return Agent(
            role='전문 리서처',
            goal='{topic}에 대한 시장 조사를 수행하고 핵심 인사이트를 추출함',
            backstory='당신은 전 세계의 데이터를 훑어 가장 가치 있는 정보만 찾아내는 정보 수집의 달인입니다.',
            tools=[web_search_tool, trend_analysis_tool],
            llm=self.model,
            allow_delegation=True,
            verbose=True,
        )

    def writer(self) -> Agent:
        return Agent(
            role='콘텐츠 에디터',
            goal='리서치 데이터를 바탕으로 독자에게 감동을 주는 글을 작성함',
            backstory='당신은 평범한 사실을 매력적인 이야기로 바꾸는 능력을 가진 스타 작가입니다.',
            tools=[draft_outline_tool, style_check_tool],
            llm=self.model,
            allow_delegation=True,
            verbose=True
        )

    def research_task(self) -> Task:
        return Task(
            name="미래전망 리서치",
            description="{topic}의 현재 상태와 미래 전망에 대해 조사하고 요약하세요. 5문장내로.",
            expected_output="주제의 핵심 트렌드와 데이터가 포함된 리서치 보고서",
            agent=self.researcher()
        )

    def write_task(self) -> Task:
        return Task(
            name="블로그 작성",
            description="리서치 보고서를 바탕으로 대중이 읽기 쉬운 블로그 포스트를 작성하세요. 5문장내로.",
            expected_output="마크다운 형식의 완성된 블로그 게시글",
            agent=self.writer()
        )

    def crew(self) -> Crew:
        return Crew(
            agents=[self.researcher(), self.writer()],
            tasks=[self.research_task(), self.write_task()],
            process=Process.sequential,
            verbose=True,
            stream=self.stream,
        )
