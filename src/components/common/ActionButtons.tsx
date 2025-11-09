import { Eye, Pencil, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete?: boolean;
}

export const ActionButtons = ({ onView, onEdit, onDelete, canDelete = true }: ActionButtonsProps) => {
  return (
    <div className="flex items-center gap-2">
      {/* View Details */}
      <button
        onClick={onView}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20"
        title="View Details"
      >
        <Eye className="w-5 h-5" />
      </button>

      {/* Edit */}
      <button
        onClick={onEdit}
        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-900/20"
        title="Edit"
      >
        <Pencil className="w-5 h-5" />
      </button>

      {/* Delete */}
      {canDelete && (
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};