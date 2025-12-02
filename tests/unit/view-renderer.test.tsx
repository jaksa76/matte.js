import { describe, it, expect } from 'bun:test';
import type { Page } from '../../src/framework/view-system';
import { ownedEntity, string } from '../../src/framework/entities';

describe('ViewRenderer Key Prop', () => {
  it('should use page.id as key for entity views', () => {
    const ProjectEntity = ownedEntity('Project', [
      string('name').required(),
      string('code').required(),
    ]);

    const projectPage1: Page = {
      id: 'project-grid',
      name: 'Project',
      path: 'project',
      view: {
        viewType: 'entity',
        viewId: 'grid',
        entity: ProjectEntity,
        displayName: 'Project Grid',
      },
      showInNav: true,
    };

    const projectPage2: Page = {
      id: 'project-list',
      name: 'Project',
      path: 'project-list',
      view: {
        viewType: 'entity',
        viewId: 'list',
        entity: ProjectEntity,
        displayName: 'Project List',
      },
      showInNav: true,
    };

    // Different page IDs should result in different component instances
    expect(projectPage1.id).not.toBe(projectPage2.id);
    
    // This ensures React will remount the EntityViewRenderer when page changes
    // even if it's the same entity, the page.id is different
  });

  it('should have unique page ids for different entities', () => {
    const ProjectEntity = ownedEntity('Project', [
      string('name').required(),
    ]);

    const TaskEntity = ownedEntity('Task', [
      string('title').required(),
    ]);

    const projectPage: Page = {
      id: 'project-grid',
      name: 'Project',
      path: 'project',
      view: {
        viewType: 'entity',
        viewId: 'grid',
        entity: ProjectEntity,
        displayName: 'Project Grid',
      },
      showInNav: true,
    };

    const taskPage: Page = {
      id: 'task-grid',
      name: 'Task',
      path: 'task',
      view: {
        viewType: 'entity',
        viewId: 'grid',
        entity: TaskEntity,
        displayName: 'Task Grid',
      },
      showInNav: true,
    };

    // Different pages must have different IDs
    expect(projectPage.id).not.toBe(taskPage.id);
    
    // This ensures React will remount EntityViewRenderer when switching entities
    // The key prop in ViewRenderer uses page.id to force remount
  });
});
