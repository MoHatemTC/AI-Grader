import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface GeneratedCriterion {
  criterion: string;
  priority: string;
  penalty_points: number;
}

interface RubricSectionProps {
  header: string;
  items: GeneratedCriterion[];
  isLoading?: boolean;
  onItemsChange?: (items: GeneratedCriterion[]) => void;
}

const RubricSection = ({
  header,
  items,
  isLoading = false,
  onItemsChange,
}: RubricSectionProps) => {
  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 bg-muted rounded animate-pulse-slow"
          ></div>
        ))}
      </Card>
    );
  }


  // helper to update a single cell
  const handleChange = (
    idx: number,
    field: keyof GeneratedCriterion,
    value: string
  ) => {
    const updated = items.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    
    onItemsChange && onItemsChange(updated);
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-2">{header}</h3>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 border">Criterion</th>
              <th className="p-2 border">priority</th>
              <th className="p-2 border">penalty_points</th>
            </tr>
          </thead>
          <tbody>
            {items && items.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50"
              >
                <td className="p-2 border align-top">
                  {onItemsChange ? (
                    <textarea
                      className="w-full"
                      value={row.criterion}
                      onChange={(e) =>
                        handleChange(idx, "criterion", e.target.value)
                      }
                    />
                  ) : (
                    row.criterion
                  )}
                </td>
                <td className="p-2 border align-top">
                  {onItemsChange ? (
                    <textarea
                      className="w-full"
                      value={row.priority}
                      onChange={(e) =>
                        handleChange(idx, "priority", e.target.value)
                      }
                    />
                  ) : (
                    row.priority
                  )}
                </td>
                <td className="p-2 border align-top">
                  {onItemsChange ? (
                    <textarea
                      className="w-full"
                      value={row.penalty_points}
                      onChange={(e) =>
                        handleChange(idx, "penalty_points", e.target.value)
                      }
                    />
                  ) : (
                    row.penalty_points
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RubricSection;
