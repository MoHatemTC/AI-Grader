"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useRef } from "react";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTaskData } from "@/hooks/useTaskData";
import UsersList from "@/components/UsersList";
import { useUsers } from "@/hooks/useUsers";
import { Textarea } from "@/components/ui/textarea";
import { Task, User } from "@/types";
import TaskDescription from "@/components/TaskDescription";
import RubricSection from "@/components/RubricSection";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface GeneratedCriterion {
  criterion: string;
  priority: string;
  penalty_points: number;
}
interface GeneratedRubric {
  rubric: GeneratedCriterion[];
}

interface GradingResults {
  user_id: string;
  scope_score: number;
  scope_comment: string;
  quality_score: number;
  quality_comment: string;
}

type rubricDetails = {
  maxScore: number;
  passedScore: number;
  finalScore: number;
};

export default function TaskSubmissionsPage() {
  const router = useRouter();
  const params = useParams();

  const courseId = params.courseId as string;
  const taskId = params.taskId as string;

  const [deliverableRubric, setDeliverableRubric] = useState<
    GeneratedCriterion[] | null
  >(null);
  const [qualityRubric, setQualityRubric] = useState<
    GeneratedCriterion[] | null
  >(null);
  const [rubricDetails, setRubricDetails] = useState<rubricDetails | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [solutionText, setSolutionText] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradingResults, setGradingResults] = useState<GradingResults[] | null>(
    null
  );
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(0);
  const [gradedUsers, setGradedUsers] = useState<User[] | null>(null);
  const [savingRubrics, setSavingRubrics] = useState(false);
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null);
  const [isSolutionUrl, setIsSolutionUrl] = useState(false);

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
        body: JSON.stringify({
          task_id: taskId,
          task_description: task?.description,
        }),
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

      setDeliverableRubric(data.rubric.Scope || null);
      setQualityRubric(data.rubric.Quality || null);
      setRubricDetails({
        maxScore: data.rubric.max_score,
        passedScore: data.rubric.passed_score,
        finalScore: data.rubric.final_score,
      });
      toast.success("Rubrics generated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const saveRubricsToDatabase = async () => {
    if (!deliverableRubric || !qualityRubric) {
      toast.error("Rubrics not generated yet. Please generate them first.");
      return;
    }
    setSavingRubrics(true);
    try {
      const res = await fetch(`${BASE_URL}/save_rubric`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          task_id: taskId,
          deliverable_rubric: JSON.stringify(deliverableRubric),
          quality_rubric: JSON.stringify(qualityRubric),
          max_score: rubricDetails?.maxScore,
          passed_score: rubricDetails?.passedScore,
          final_score: rubricDetails?.finalScore,
        }),
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
      toast.success("Rubrics saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRubrics(false);
    }
  };

  const gradingSelectedUsers = async () => {
    
    if (selectedUsers.length === 0) {
      toast.error("No users selected for grading.");
      return;
    }
    if (selectedUsers.length > 3) {
      toast.error("Please select at most three users for grading.");
      return;
    }
    // if (selectedUsers[0].status == "passed" || selectedUsers[0].status == "not_passed" ) {
    //   toast.error("This user has already been graded. Please select another user.");
    //   return;
    // }
    // if (!solutionText && !solutionUrl) {
    //   toast.error(
    //     "No solution provided. Please upload a file or provide a URL."
    //   );
    //   return;
    // }
    // if (solutionText && solutionUrl) {
    //   toast.error("Please provide either a file or a URL, not both.");
    //   return;
    // }
    // if (solutionUrl) {
    //   const urlPattern = /^(https?:\/\/).*\.py$/;
    //   if (!urlPattern.test(solutionUrl)) {
    //     toast.error("Please provide a valid URL to a .py file.");
    //     return;
    //   }
    // }
    if (!deliverableRubric || !qualityRubric) {
      toast.error("Rubrics not generated yet. Please generate them first.");
      return;
    }

    const user = selectedUsers[0];
    setGradedUsers(user ? [user] : null);
    setGradingResults(null);
    setCurrentResultIndex(0);
    setGradedUsers(selectedUsers); // Just pass the array directly
    toast.info("Grading in progress. Please wait...");

    setGrading(true);
    try {
      const res = await fetch(`${BASE_URL}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          task_description: task?.description,
          scope_rubric: JSON.stringify(deliverableRubric),
          requirements_rubric: JSON.stringify(qualityRubric),
          ...(solutionText
            ? { solution: solutionText }
            : { solution_url: solutionUrl }),
          journey_name: task?.title,
          users: selectedUsers,
        }),
      });
      console.log("Grading response:", res);

      if (!res.ok) {
        console.log("Error:", res);
        toast.error("Error grading submissions. Please try again.");
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON, got:", text);
        return;
      }
      const data = await res.json();
      console.log("Grading data:", data);

      toast.success("Grading completed successfully!");
      setGradingResults(data); // Now data is expected to be an array of results
    } catch (err) {
      console.error(err);
      toast.error("Error grading submissions. Please try again.");
    } finally {
      setGrading(false);
    }
  };

  const {
    filteredUsers,
    selectedUsers,
    searchQuery: userSearchQuery,
    setSearchQuery: setUserSearchQuery,
    isLoading: isUsersLoading,
    handleViewUser,
    handleSelectAll: handleSelectAllUsers,
    handleSelectUser,
  } = useUsers(taskId);

  const {
    task,
    course,
    isLoading: isTaskDataLoading,
  } = useTaskData(taskId, courseId);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSolutionText(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  const isLoading = isTaskDataLoading;

  // Add a function to handle exporting results to Excel
  const handleExportResults = () => {
    if (!gradingResults || !gradedUsers) {
      toast.error("No grading results to export");
      return;
    }

    try {
      // Create data for export
      const exportData = gradingResults.map((result) => {
        const user = gradedUsers.find(
          (u) => u.id.toString() === result.user_id.toString()
        );

        return {
          user_id: result.user_id,
          user_name: user?.fullName || "Unknown Username",
          user_email: user?.email || "Unknown Email",
          task_id: taskId,
          scope_score: result.scope_score,
          scope_comment: result.scope_comment,
          quality_score: result.quality_score,
          quality_comment: result.quality_comment,
        };
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Grading Results");

      // Format the column widths for better readability
      const maxWidth = 50;
      const colWidths: { [key: string]: number } = {};

      exportData.forEach((row: any) => {
        Object.keys(row).forEach((key: any) => {
          const value = String(row[key]);
          colWidths[key] = Math.min(
            Math.max(colWidths[key] || 0, value.length),
            maxWidth
          );
        });
      });

      worksheet["!cols"] = Object.keys(exportData[0]).map((key) => ({
        wch: Math.max(key.length, colWidths[key] || 10),
      }));

      // Generate Excel file and trigger download
      XLSX.writeFile(
        workbook,
        `grading-results-${taskId}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );

      toast.success("Grading results exported successfully");
    } catch (error) {
      console.error("Error exporting results:", error);
      toast.error("Failed to export grading results");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <Button
          variant="ghost"
          className="mb-6 -ml-3 animate-fade-in"
          onClick={() => router.push(`/course/${courseId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-24 bg-muted rounded-xl animate-pulse-slow"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-muted rounded-xl animate-pulse-slow"></div>
              <div className="h-96 bg-muted rounded-xl animate-pulse-slow"></div>
            </div>
          </div>
        ) : task && course ? (
          <>
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl font-semibold">{task.title}</h2>
                  <p className="text-muted-foreground mt-1">{course.title}</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={handleExportResults}
                    disabled={!gradingResults || gradingResults.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  {/* <Button
                    variant="outline"
                    className="text-sm cursor-pointer"
                    onClick={() => {
                      setIsSolutionUrl(!isSolutionUrl);
                      setSolutionText("");
                      setSolutionUrl(null);
                    }}
                  >
                    {isSolutionUrl ? "Use File" : "Use URL"}
                  </Button> */}
                </div>
              </div>
            </div>

            {/* <div className="mt-6">
              <h3 className="text-lg font-medium">Solution</h3>
              {isSolutionUrl ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Enter URL to Python file"
                    value={solutionUrl || ""}
                    onChange={(e) => setSolutionUrl(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="text-sm cursor-pointer"
                    onClick={handleImportClick}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <input
                    type="file"
                    accept=".txt,.py"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
              {!isSolutionUrl && solutionText && (
                <div className="mt-4">
                  <h4 className="text-md font-medium">Solution Content</h4>
                  <Textarea
                    className="w-full mt-2"
                    value={solutionText}
                    onChange={(e) => setSolutionText(e.target.value)}
                    rows={10}
                  />
                </div>
              )}
            </div> */}

            <div className="space-y-6">
              <Button
                onClick={generateRubrics}
                disabled={generating}
                className="animate-fade-in mt-4 bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
              >
                Get / Generate Rubrics
              </Button>

              <TaskDescription
                title="Task Description"
                description={task.description}
                isLoading={isLoading}
              />

              {rubricDetails && (
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <h3 className="text-lg font-medium">Rubric Details</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <p>Max Score: {rubricDetails.maxScore}</p>
                    <p>Passed Score: {rubricDetails.passedScore}</p>
                    <p>Final Score: {rubricDetails.finalScore}</p>
                  </div>
                </div>
              )}

              {deliverableRubric && (
                <RubricSection
                  items={deliverableRubric}
                  header="Deliverable Rubric"
                  isLoading={isLoading}
                  onItemsChange={(newItems) => {
                    setDeliverableRubric([...newItems]);
                  }}
                />
              )}

              {qualityRubric && (
                <RubricSection
                  header="Quality Rubric"
                  items={qualityRubric}
                  isLoading={isLoading}
                  onItemsChange={(newItems) => setQualityRubric([...newItems])}
                />
              )}

              {deliverableRubric && qualityRubric && (
                <Button
                  onClick={saveRubricsToDatabase}
                  disabled={generating || savingRubrics}
                  className="animate-fade-in bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
                >
                  Save Rubrics to Database
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div
                className="lg:col-span-2 space-y-6 animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                <UsersList
                  filteredUsers={filteredUsers}
                  selectedUsers={selectedUsers}
                  searchQuery={userSearchQuery}
                  onSearchChange={setUserSearchQuery}
                  onSelectAll={handleSelectAllUsers}
                  onSelectUser={handleSelectUser}
                  onViewUser={handleViewUser}
                  isLoading={isUsersLoading}
                />
              </div>

              <div
                className="animate-fade-in flex flex-col gap-1.5"
                style={{ animationDelay: "0.2s" }}
              >
                <Card className="p-6 shadow-sm">
                  <CardContent className="space-y-4">
                    <h3 className="text-lg font-medium">Grading</h3>
                    {selectedUsers.length > 0 ? (
                      <div className="text-lg font-medium">
                        Selected Users Names:
                        {selectedUsers.map((user, idx) => (
                          <p key={idx}>{user.fullName}</p>
                        ))}
                        <p>Total Selected Users: {selectedUsers.length}</p>
                      </div>
                    ) : (
                      <p>No users selected</p>
                    )}
                    <Button
                      onClick={gradingSelectedUsers}
                      disabled={grading || selectedUsers.length === 0}
                      className="animate-fade-in bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
                    >
                      {grading ? "Grading..." : "Grade Selected Users"}
                    </Button>
                  </CardContent>
                </Card>
                {gradingResults && gradingResults.length > 0 && gradedUsers && (
                  <GradingResults
                    results={gradingResults}
                    currentIndex={currentResultIndex}
                    onChangeIndex={setCurrentResultIndex}
                    taskId={taskId}
                    gradedUsers={gradedUsers}
                    onChange={(updatedResult) => {
                      const newResults = [...gradingResults];
                      newResults[currentResultIndex] = updatedResult;
                      setGradingResults(newResults);
                    }}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-bold mb-2">Task not found</h2>
            <p className="text-muted-foreground mb-6">
              The task you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push(`/course/${courseId}`)}>
              Return to Course
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

interface GradingResultsProps {
  results: GradingResults[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
  taskId: string;
  gradedUsers: User[];
  onChange: (updatedResult: GradingResults) => void;
}

function GradingResults({
  results,
  currentIndex,
  onChangeIndex,
  taskId,
  gradedUsers,
  onChange,
}: GradingResultsProps) {
  const currentResult = results[currentIndex];

  // Find the matching user by comparing as strings to ensure type safety
  const currentUser = gradedUsers.find(
    (user) => user.id.toString() === currentResult.user_id.toString()
  );

  const handleScoreChange = (field: keyof GradingResults, value: number) => {
    onChange({ ...currentResult, [field]: value });
  };

  const handleCommentChange = (field: keyof GradingResults, value: string) => {
    onChange({ ...currentResult, [field]: value });
  };

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const handleSaveChanges = () => {
    if (!currentUser) {
      toast.error("No user found that matches the result ID.");
      return;
    }
    const updatedResults = {
      ...currentResult,
      scope_score: Math.max(0, Math.min(100, currentResult.scope_score)),
      quality_score: Math.max(0, Math.min(100, currentResult.quality_score)),
      taskId: taskId,
      user: currentUser,
    };

    fetch(`${BASE_URL}/save_grading_results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updatedResults),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save grading results");
        }
        return res.json();
      })
      .then((data) => {
        toast.success(data.message || "Grading results saved");
      })
      .catch((error) => {
        console.error("Error saving grading results:", error);
        toast.error("Error saving grading results. Please try again.");
      });
  };

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Grading Results</h3>

          {results.length > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm">
                {currentIndex + 1} of {results.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChangeIndex(Math.min(results.length - 1, currentIndex + 1))
                }
                disabled={currentIndex === results.length - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <p>
          For {currentUser?.fullName || `User ID: ${currentResult.user_id}`}
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-medium">Scope Score</h4>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleScoreChange(
                      "scope_score",
                      Math.max(0, currentResult.scope_score - 5)
                    )
                  }
                >
                  -
                </Button>
                <span className="mx-2 font-medium">
                  {currentResult.scope_score}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleScoreChange(
                      "scope_score",
                      Math.min(100, currentResult.scope_score + 5)
                    )
                  }
                >
                  +
                </Button>
              </div>
            </div>
            <Textarea
              className="w-full"
              value={currentResult.scope_comment}
              onChange={(e) =>
                handleCommentChange("scope_comment", e.target.value)
              }
              rows={4}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-medium">Quality Score</h4>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleScoreChange(
                      "quality_score",
                      Math.max(0, currentResult.quality_score - 5)
                    )
                  }
                >
                  -
                </Button>
                <span className="mx-2 font-medium">
                  {currentResult.quality_score}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleScoreChange(
                      "quality_score",
                      Math.min(100, currentResult.quality_score + 5)
                    )
                  }
                >
                  +
                </Button>
              </div>
            </div>
            <Textarea
              className="w-full"
              value={currentResult.quality_comment}
              onChange={(e) =>
                handleCommentChange("quality_comment", e.target.value)
              }
              rows={4}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="bg-blue-600 hover:bg-blue-500 cursor-pointer"
              onClick={handleSaveChanges}
              disabled={!currentResult.scope_comment}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
