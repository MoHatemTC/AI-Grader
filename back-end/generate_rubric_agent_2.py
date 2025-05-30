import json
import re
from openai import OpenAI

# I made that change to fix incompatibility with the latest OpenAI library
openai = OpenAI()

class RubricGenerationAgent:
    def __init__(self, model="gpt-3.5-turbo"):
        self.model = model

    def run(self, task_list, output_file="rubric.json"):
        if not task_list or not isinstance(task_list, list):
            print("No valid task provided.")
            return []

        task = task_list[0]

        prompt = f"""
You are an expert evaluator.

You will receive a task that includes:
- A title
- A description
- A list of functional requirements

Your job is to create a binary scoring rubric that evaluates the student's solution.

The rubric must include:
1. "Scope" — functional requirements from the task (what to build)and exist or not .
2. "Quality" — non-functional aspects such as code clarity, UI design, UX, maintainability, testing, performance, and adherence to best practices.

For each criterion, provide:
- "criterion": What is being evaluated (derived from the task description and implied expectations)
- "priority": High / Medium / Low
- "penalty_points": Based on priority (High=10, Medium=5, Low=2)


Format:
{{
  "Scope": [...],
  "Quality": [...]
}}

Important:
- Use the task content to generate Scope items.
- For Quality, infer what's reasonably expected in such a project (e.g., clean UI, working navigation, valid input handling, responsiveness, etc.)
- Do NOT invent features, just infer likely expectations.
- Return only valid JSON. No markdown, no explanation, no formatting issues.

Here is the task in JSON:

{json.dumps(task)}
"""

        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500,
            )

            raw_output = response.choices[0].message.content.strip()
            rubric_data = self._clean_model_output(raw_output)
            rubric_data = json.loads(rubric_data)

            if "Scope" not in rubric_data or "Quality" not in rubric_data:
                raise ValueError(
                    "Rubric must contain both 'Scope' and 'Quality' sections."
                )

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(rubric_data, f, indent=2, ensure_ascii=False)

            return rubric_data

        except json.JSONDecodeError as e:
            print("Rubric JSON Decode Error:", e)
            print("Raw Output:\n", raw_output)
            return []

        except openai.error.OpenAIError as e:
            print("OpenAI API Error:", e)
            return []

        except Exception as e:
            print("General Error:", e)
            return []

    def _clean_model_output(self, text):
        text = text.strip()
        text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
        text = re.sub(r"\n", "", text)
        text = re.sub(r"[\t\s]*$", "", text)
        text = re.sub(r",\s*}", "}", text)
        return text
