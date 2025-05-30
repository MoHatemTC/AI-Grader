import { useState } from "react";
import { Task } from "@/types";
import TaskDescription from "./TaskDescription";
import RubricSection from "./RubricSection";
import { Button } from "./ui/button";

interface GeneratedCriterion {
  criterion: string;
  beginner: string;
  intermediate: string;
  advanced: string;
}
interface GeneratedRubric {
  skill: string;
  task: string;
  rubric: GeneratedCriterion[];
}

interface TaskOverviewProps {
  task: Task;
  isLoading?: boolean;
}

const TaskOverview = ({ task, isLoading = false }: TaskOverviewProps) => {
  const [deliverableRubric, setDeliverableRubric] =
    useState<GeneratedRubric | null>(null);
  const [qualityRubric, setQualityRubric] = useState<GeneratedRubric | null>(
    null
  );
  const [generating, setGenerating] = useState(false);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const generateRubrics = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${BASE_URL}/generate_rubric`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify([task.description]),
      });
      if (!res.ok) {
        console.log("Error:", res);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON, got:", text);
        return;
      }
      const data = await res.json();
      setDeliverableRubric(data.rubric[0] || null);
      setQualityRubric(data.rubric[1] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        onClick={generateRubrics}
        disabled={generating}
      >
        Generate Rubrics
      </Button>

      <TaskDescription
        title="Task Description"
        description={task.description}
        isLoading={isLoading}
      />

      {deliverableRubric && (
        <RubricSection
          header="Deliverable Rubric"
          skill={deliverableRubric.skill}
          taskTitle={deliverableRubric.task}
          items={deliverableRubric.rubric}
          isLoading={isLoading}
          onItemsChange={(newItems) =>
            setDeliverableRubric((prev) =>
              prev ? { ...prev, rubric: newItems } : prev
            )
          }
        />
      )}

      {qualityRubric && (
        <RubricSection
          header="Quality Rubric"
          skill={qualityRubric.skill}
          taskTitle={qualityRubric.task}
          items={qualityRubric.rubric}
          isLoading={isLoading}
          onItemsChange={(newItems) =>
            setQualityRubric((prev) =>
              prev ? { ...prev, rubric: newItems } : prev
            )
          }
        />
      )}
    </div>
  );
};

export default TaskOverview;
