import { Sidebar } from "./Sidebar";
import { ChatPanel } from "../chat/ChatPanel";
import { TracePanel } from "../trace/TracePanel";
import { useAgent } from "../../hooks/useAgent";
import { useSession } from "../../context/SessionContext";
import type { TaskStatus } from "../../types";

function TaskPill({ task }: { task: TaskStatus }) {
  const icon =
    task.status === "done"    ? <span className="text-green-400">✓</span> :
    task.status === "failed"  ? <span className="text-red-400">✗</span> :
    task.status === "running" ? (
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
    ) : (
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-app-fg3" />
    );

  const bg =
    task.status === "done"    ? "bg-green-950/60 border-green-800/40 text-green-300" :
    task.status === "failed"  ? "bg-red-950/60 border-red-800/40 text-red-300" :
    task.status === "running" ? "bg-blue-950/60 border-blue-700/40 text-blue-300" :
                                "bg-app-card border-white/[.07] text-app-fg3";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${bg}`}>
      {icon}
      {task.label}
    </span>
  );
}

function AppHeader({ isAgentRunning, tasks, sessionTitle }: {
  isAgentRunning: boolean;
  tasks: TaskStatus[];
  sessionTitle: string;
}) {
  return (
    <div
      className="h-11 shrink-0 flex items-center px-4 gap-4"
      style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-panel)" }}
    >
      {/* Left: logo + title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-6 h-6 rounded-md bg-tum-blue flex items-center justify-center text-white text-[10px] font-medium tracking-wide">
          CC
        </div>
        <span className="text-[13px] font-medium text-app-fg">Campus Co-Pilot</span>
        {sessionTitle && sessionTitle !== "New session" && (
          <>
            <span className="text-app-fg3 text-[12px]">/</span>
            <span className="text-[12px] text-app-fg2 truncate max-w-[200px]">{sessionTitle.slice(0, 32)}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Right: agent status */}
      <div className="flex items-center gap-2 shrink-0">
        {isAgentRunning ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-green" />
            <span className="text-[11px] text-app-fg2">Agent active</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-app-fg3" />
            <span className="text-[11px] text-app-fg3">Ready</span>
          </>
        )}
      </div>
    </div>
  );
}

export function AppShell() {
  const { sendMessage, resolveAction, dismissConflict } = useAgent();
  const { activeSession } = useSession();

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>
      <AppHeader
        isAgentRunning={activeSession?.isAgentRunning ?? false}
        tasks={activeSession?.tasks ?? []}
        sessionTitle={activeSession?.title ?? ""}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar sendMessage={sendMessage} />
        <div className="flex flex-1 overflow-hidden min-w-0">
          <ChatPanel
            sendMessage={sendMessage}
            resolveAction={resolveAction}
            dismissConflict={dismissConflict}
          />
          <TracePanel sendMessage={sendMessage} />
        </div>
      </div>
    </div>
  );
}
