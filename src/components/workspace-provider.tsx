"use client";

import { createContext, useContext } from "react";

export interface WorkspaceIdentity {
  workspaceName: string;
  userName: string;
  userEmail: string;
  role: string;
  isSuperAdmin: boolean;
}

const WorkspaceContext = createContext<WorkspaceIdentity>({
  workspaceName: "Your workspace",
  userName: "Your account",
  userEmail: "",
  role: "Member",
  isSuperAdmin: false,
});

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceIdentity;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceIdentity() {
  return useContext(WorkspaceContext);
}
