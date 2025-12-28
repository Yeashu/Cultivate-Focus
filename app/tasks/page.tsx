"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  type Variants,
} from "framer-motion";
import {
  Circle,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { useFocus } from "@/context/focus-context";
import type { TaskDTO } from "@/types";

const taskVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export default function TasksPage() {
  const { tasks, createTask, updateTask, deleteTask, loading, error } = useFocus();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [submitting, setSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: "",
    description: "",
    focusMinutes: 30,
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    if (filter === "active") {
      return tasks.filter((task) => !task.completed);
    }
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  }, [filter, tasks]);

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    setSubmitting(true);
    setActionMessage(null);

    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        focusMinutesGoal: focusMinutes > 0 ? focusMinutes : null,
      });
      setTitle("");
      setDescription("");
      setFocusMinutes(25);
      setActionMessage("Task created. Stay consistent!");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Unable to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (task: TaskDTO) => {
    setEditingTaskId(task._id);
    setEditValues({
      title: task.title,
      description: task.description ?? "",
      focusMinutes: task.focusMinutesGoal ?? 30,
    });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
  };

  const saveEdits = async (taskId: string) => {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await updateTask({
        id: taskId,
        title: editValues.title.trim(),
        description: editValues.description.trim(),
        focusMinutesGoal: editValues.focusMinutes > 0 ? editValues.focusMinutes : null,
      });
      setEditingTaskId(null);
      setActionMessage("Task updated.");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Unable to update task.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCompletion = async (task: TaskDTO) => {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await updateTask({ id: task._id, completed: !task.completed });
      setActionMessage(task.completed ? "Restarted this task." : "Nice! Task completed.");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Unable to update task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await deleteTask(taskId);
      setActionMessage("Task removed.");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Unable to delete task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Create a Focus Point task
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Break work into mindful sessions. Set a focus goal and earn Focus Points as you complete them.
        </p>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleCreateTask}>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-[var(--muted)]" htmlFor="task-title">
              Title
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
              placeholder="Write research summary"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-[var(--muted)]" htmlFor="task-focus">
              Focus minutes goal (optional)
            </label>
            <input
              id="task-focus"
              type="number"
              min={0}
              max={600}
              value={focusMinutes}
              onChange={(event) => setFocusMinutes(Number(event.target.value))}
              placeholder="Leave 0 for no goal"
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--muted)]" htmlFor="task-description">
              Description (optional)
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="md:col-span-2 flex items-center justify-center gap-2 rounded-full bg-[var(--focus)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--focus)]/90"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add task
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Your focus tasks</h2>
          <div className="flex items-center gap-2 rounded-full bg-[var(--surface-muted)]/60 p-1 text-sm font-medium">
            {["all", "active", "completed"].map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-full px-4 py-1.5 capitalize transition-all ${
                  filter === option
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow"
                    : "text-[var(--muted)]"
                }`}
                onClick={() => setFilter(option as typeof filter)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-300/60 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-muted)]/40 p-3 text-sm text-[var(--muted)]">
            {actionMessage}
          </div>
        ) : null}

        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((task) => {
              const goal = task.focusMinutesGoal;
              const completion = goal
                ? Math.min(100, Math.round((task.earnedPoints / goal) * 100))
                : 0;
              const isEditing = editingTaskId === task._id;

              return (
                <motion.div
                  key={task._id}
                  variants={taskVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 flex-col gap-2">
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => toggleCompletion(task)}
                        disabled={submitting}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-[var(--focus)]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[var(--muted)]" />
                        )}
                        <span className="text-base font-semibold text-[var(--foreground)]">
                          {isEditing ? (
                            <input
                              value={editValues.title}
                              onChange={(event) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  title: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--focus)] focus:outline-none"
                            />
                          ) : (
                            task.title
                          )}
                        </span>
                      </button>
                      <div className="pl-8">
                        {isEditing ? (
                          <textarea
                            value={editValues.description}
                            onChange={(event) =>
                              setEditValues((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--focus)] focus:outline-none"
                            rows={2}
                          />
                        ) : task.description ? (
                          <p className="text-sm text-[var(--muted)]">{task.description}</p>
                        ) : (
                          <p className="text-sm text-[var(--muted)] italic">
                            Add notes to stay intentional.
                          </p>
                        )}
                        <div className="mt-3 h-2 w-full rounded-full bg-[var(--surface-muted)]/60">
                          <div
                            className={`h-full rounded-full ${
                              task.completed
                                ? "bg-[var(--focus)]"
                                : "bg-[var(--accent)]"
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--muted)]">
                          <span>{completion}% towards goal</span>
                          <span>•</span>
                          <span>
                            {task.earnedPoints}{task.focusMinutesGoal ? ` / ${task.focusMinutesGoal}` : ''} Focus Points
                          </span>
                          <span>•</span>
                          <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 self-center md:self-start">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-[var(--muted)]">
                            Focus minutes
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={600}
                            value={editValues.focusMinutes}
                            onChange={(event) =>
                              setEditValues((prev) => ({
                                ...prev,
                                focusMinutes: Number(event.target.value),
                              }))
                            }
                            className="w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--focus)] focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="flex items-center gap-2 rounded-full bg-[var(--focus)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--focus)]/90"
                              onClick={() => saveEdits(task._id)}
                              disabled={submitting}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--foreground)]"
                            onClick={() => startEditing(task)}
                          >
                            <Edit3 className="h-4 w-4" /> Edit
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 transition-colors hover:border-red-400 hover:text-red-600"
                            onClick={() => handleDelete(task._id)}
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {!loading && filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)]/60 p-12 text-center text-sm text-[var(--muted)]">
            No tasks here yet. Set a mindful goal to begin cultivating focus.
          </div>
        ) : null}
      </section>
    </div>
  );
}
