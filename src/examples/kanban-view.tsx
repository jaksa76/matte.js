/**
 * Example: Adding a Custom Kanban View
 * 
 * This example demonstrates how to create a custom view type using the
 * simplified view registry system. No modifications to framework code required!
 */

import { 
  ownedEntity, 
  string, 
  enum as enumField,
  date,
} from '../framework/entities';
import { createEntityDisplay, createPage } from '../framework/view-system';
import { 
  viewRegistry, 
  useEntityData,
  LoadingSpinner,
  ErrorDisplay,
  EmptyState,
} from '../framework/ui';
import type { EntityDefinition } from '../framework/entities';

// ============================================================================
// Step 1: Create the View Component
// ============================================================================

interface KanbanViewProps {
  entity: EntityDefinition;
  apiUrl: string;
  statusField?: string;
  onSelect?: (item: any) => void;
  onEdit?: (item: any) => void;
  onCreate?: () => void;
}

function KanbanView({ 
  entity, 
  apiUrl, 
  statusField = 'status',
  onSelect,
  onEdit,
  onCreate,
}: KanbanViewProps) {
  // Use the shared hook for data fetching
  const { items, loading, error, refresh } = useEntityData(apiUrl);

  // Use shared loading component
  if (loading) return <LoadingSpinner message={`Loading ${entity.name}s...`} />;
  
  // Use shared error component
  if (error) return <ErrorDisplay error={error} onRetry={refresh} />;

  // Get the status field definition
  const statusFieldDef = entity.schema[statusField];
  
  // Determine available statuses
  const statuses = statusFieldDef?.type === 'enum' 
    ? statusFieldDef.values 
    : [...new Set(items.map(item => item[statusField]))];

  return (
    <div className="kanban-view">
      <div className="kanban-header">
        <h1>{entity.name} Board</h1>
        {onCreate && (
          <button onClick={onCreate} className="btn btn-primary">
            + Create New {entity.name}
          </button>
        )}
      </div>

      <div className="kanban-board">
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            items={items.filter(item => item[statusField] === status)}
            entity={entity}
            onSelect={onSelect}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({ 
  status, 
  items, 
  entity,
  onSelect,
  onEdit,
}: {
  status: string;
  items: any[];
  entity: EntityDefinition;
  onSelect?: (item: any) => void;
  onEdit?: (item: any) => void;
}) {
  return (
    <div className="kanban-column">
      <h2 className="kanban-column-header">
        {status}
        <span className="kanban-count">{items.length}</span>
      </h2>
      
      <div className="kanban-cards">
        {items.length === 0 ? (
          <EmptyState message={`No ${status.toLowerCase()} items`} />
        ) : (
          items.map(item => (
            <div key={item.id} className="kanban-card">
              {/* Display first few non-hidden fields */}
              {Object.entries(entity.schema)
                .filter(([_, field]) => !field.ui?.hidden)
                .slice(0, 3)
                .map(([fieldName, field]) => {
                  const ui = field.ui || {};
                  const labelText = ui.label !== undefined ? ui.label : fieldName;
                  
                  return (
                    <div key={fieldName} className="kanban-card-field">
                      {!ui.hideLabel && labelText && (
                        <strong>{labelText}: </strong>
                      )}
                      <span>{formatValue(item[fieldName], field)}</span>
                    </div>
                  );
                })}
              
              <div className="kanban-card-actions">
                {onSelect && (
                  <button 
                    onClick={() => onSelect(item)}
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(item)}
                    className="btn btn-info btn-sm"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatValue(value: any, field: any): string {
  if (value === null || value === undefined) return '-';
  if (field.type === 'date') return new Date(value).toLocaleDateString();
  return String(value);
}

// ============================================================================
// Step 2: Register the View Component
// ============================================================================

viewRegistry.registerEntityView('kanban', KanbanView);

// ============================================================================
// Step 3: Create a Helper Function (Optional)
// ============================================================================

export function kanbanView(entity: EntityDefinition, options?: {
  pageName?: string;
  pagePath?: string;
  statusField?: string;
}): any {
  const display = createEntityDisplay('kanban', entity, {
    displayName: options?.pageName || `${entity.name} Board`,
    metadata: {
      statusField: options?.statusField || 'status',
    },
  });

  return createPage(
    `${entity.name}-kanban`,
    options?.pageName || `${entity.name} Board`,
    options?.pagePath || toKebabCase(entity.name),
    display
  );
}

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
}

// ============================================================================
// Step 4: Use It!
// ============================================================================

// Define an entity with a status field
const Task = ownedEntity("Task", [
  string("title").required(),
  string("description"),
  enumField("status", ["Todo", "In Progress", "Done"]).required(),
  date("dueDate"),
]);

// Now you can use the kanban view just like built-in views:
// app.register(kanbanView(Task, {
//   pageName: "Task Board",
//   pagePath: "tasks",
//   statusField: "status"
// }));

// Or use it directly:
// const page = createPage(
//   'task-board',
//   'Tasks',
//   'tasks',
//   createEntityDisplay('kanban', Task, {
//     metadata: { statusField: 'status' }
//   })
// );
// app.register(page);

console.log('Kanban view registered! Ready to use with:', Task.name);
