import { useRouter } from "next/navigation";
import { Task } from "@/types";
import { ClipboardCheck, Calendar, UserCircle2, UserCog2, CheckCircle } from "lucide-react";
import { Badge } from "./ui/badge";

interface TaskCardProps {
  task: Task;
  className?: string;
  learnerCount?: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, className = "" , learnerCount = 0 }) => {
  const router = useRouter();
  const isPastDue = task.dueDate ? new Date(task.dueDate) < new Date() : false;

  return (
    <div
      className={`bg-white rounded-lg border border-border p-5 hover:shadow-md transition-all duration-300 cursor-pointer ${className}`}
      onClick={() => router.push(`/course/${task.courseId}/task/${task.id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg">{task.title}</h3>
          <p
            className="text-muted-foreground text-sm line-clamp-2 mt-1"
            dangerouslySetInnerHTML={{
              __html:
                task.description
                  .replace(/<[^>]+>/g, "")
                  .replace(/&nbsp;/g, " ")
                  .slice(0, 50) + "...",
            }} // Truncate description to 100 characters
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <UserCircle2 className="w-4 h-4 mr-1" />
          <span>{learnerCount} learners</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <ClipboardCheck className="w-4 h-4 mr-1" />
          <span>
            {task.scoredSubmissions}/{task.totalSubmissions} graded
          </span>
        </div>

        {task.dueDate && (
          <div
            className={`flex items-center text-sm ${
              isPastDue ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between flex-wrap">
        <Badge
          variant="outline"
          className="text-xs"
        >
          <UserCog2 className="w-4 h-4 mr-1" />
          {task.uniqueSubmissions}
          {task.uniqueSubmissions && task.uniqueSubmissions > 1
            ? " submissions"
            : " submission"}
        </Badge>
        <Badge className="text-xs bg-red-600 text-white">
          {task.uniqueSubmissions ? learnerCount - task.uniqueSubmissions : 0}
          {task.uniqueSubmissions
            ? " not submitted"
            : " no pending submissions"}
        </Badge>
      </div>
      <div className="mt-4 flex items-center justify-between flex-wrap">
        <Badge
          variant="outline"
          className="text-xs"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          {task.scoredSubmissions}
          {" scored"}
        </Badge>
        <Badge className="text-xs bg-red-600 text-white">
          {task.totalSubmissions - task.scoredSubmissions}
          {" pending"}
        </Badge>
      </div>
    </div>
  );
};

export default TaskCard;
