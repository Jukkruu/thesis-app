"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  MockUser, MockSubmission, MockNotification, Role, FormType,
} from "@/types";

export interface SubmissionFormData {
  title: string;
  submissionType?: string;
  advisorId?: string;
  studentFullName?: string;
  studentCode?: string;
  program?: string;
  studentEmail?: string;
  studentPhone?: string;
  headCommitteeId?: string;
  committeeIds?: string[];
  coAdvisorIds?: string[];
  invitedCommitteeId?: string;
  invitedProfName?: string;
  invitedProfAffiliation?: string;
  invitedProfEmail?: string;
  invitedProfPhone?: string;
  examDate?: string;
  examTime?: string;
  roomNeeded?: boolean;
  parkingNeeded?: boolean;
  carPlate?: string;
}

// Keep DEMO_USER_IDS for the quick-login panel (demo mode)
export const DEMO_USER_IDS = [
  "superadmin@eng.chula.ac.th",
  "admin@eng.chula.ac.th",
  "student@eng.chula.ac.th",
  "niphon.w@eng.chula.ac.th",
  "angkee.s@eng.chula.ac.th",
  "alongkorn.p@eng.chula.ac.th",
  "sunhapos.c@eng.chula.ac.th",
  "viboon.s@eng.chula.ac.th",
];

interface AppContextType {
  user: MockUser | null;
  users: MockUser[];
  submissions: MockSubmission[];
  notifications: MockNotification[];
  unreadCount: number;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  createSubmission: (data: SubmissionFormData) => Promise<MockSubmission>;
  approveCurrentStep: (submissionId: string, notes?: string) => Promise<void>;
  rejectCurrentStep: (submissionId: string, notes: string) => Promise<void>;
  addUpload: (submissionId: string, formType: FormType, fileName: string, fileSize: number, fileContent?: string) => void;
  getPendingCount: (role: Role) => number;
  studentResubmit: (submissionId: string) => Promise<void>;
  cancelSubmission: (submissionId: string) => Promise<void>;
  committeeSign: (submissionId: string, decision: "APPROVED" | "REJECTED", notes?: string) => Promise<void>;
  needsMyAction: (sub: MockSubmission) => boolean;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  adminSetNote: (submissionId: string, note: string) => Promise<void>;
  adminUpdateSubmission: (id: string, updates: { title?: string; advisorId?: string }) => Promise<void>;
  adminDeleteSubmission: (id: string) => Promise<void>;
  adminResetSubmission: (id: string) => Promise<void>;
  adminOverrideStep: (submissionId: string, stepOrder: number, action: "APPROVED" | "REJECTED", notes?: string) => Promise<void>;
  superAdminUpdateUserRole: (userId: string, newRole: Role) => Promise<void>;
  superAdminDeleteUser: (userId: string) => Promise<void>;
  superAdminAddUser: (userData: Omit<MockUser, "id">, password?: string) => Promise<void>;
  superAdminChangePassword: (userId: string, newPassword: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

async function api<T>(path: string, method = "GET", body?: object): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [submissions,   setSubmissions]   = useState<MockSubmission[]>([]);
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [users,         setUsers]         = useState<MockUser[]>([]);
  const [loading,       setLoading]       = useState(true);

  const user: MockUser | null = session?.user
    ? { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role as Role, studentId: session.user.studentId }
    : null;

  const unreadCount = notifications.filter((n) => !n.isRead && n.recipientId === user?.id).length;

  async function refresh() {
    if (status !== "authenticated") return;
    const [subs, notifs, usrs] = await Promise.all([
      api<MockSubmission[]>("/api/submissions"),
      api<MockNotification[]>("/api/notifications"),
      api<MockUser[]>("/api/users"),
    ]);
    setSubmissions(subs);
    setNotifications(notifs);
    setUsers(usrs);
  }

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      refresh().finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setSubmissions([]);
      setNotifications([]);
      setUsers([]);
      setLoading(false);
    }
  }, [status]);

  async function logout() {
    await signOut({ redirect: false });
  }

  async function createSubmission(data: SubmissionFormData): Promise<MockSubmission> {
    const sub = await api<MockSubmission>("/api/submissions", "POST", data);
    setSubmissions((prev) => [sub, ...prev]);
    return sub;
  }

  async function approveCurrentStep(submissionId: string, notes?: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${submissionId}`, "PATCH", { action: "approve", notes });
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? sub : s)));
    await refreshNotifications();
  }

  async function rejectCurrentStep(submissionId: string, notes: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${submissionId}`, "PATCH", { action: "reject", notes });
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? sub : s)));
    await refreshNotifications();
  }

  // For now, addUpload uses the existing file store for backward compatibility
  // Real uploads go through /api/upload
  function addUpload(submissionId: string, formType: FormType, fileName: string, fileSize: number) {
    const id = `up-${Date.now()}`;
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        return {
          ...sub,
          uploads: [...sub.uploads, { id, formType, fileName, fileSize, uploadedAt: new Date().toISOString() }],
        };
      })
    );
  }

  async function studentResubmit(submissionId: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${submissionId}`, "PATCH", { action: "resubmit" });
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? sub : s)));
  }

  async function cancelSubmission(submissionId: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${submissionId}`, "PATCH", { action: "cancel" });
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? sub : s)));
  }

  async function committeeSign(submissionId: string, decision: "APPROVED" | "REJECTED", notes?: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${submissionId}/sign`, "POST", { decision, notes });
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? sub : s)));
    await refreshNotifications();
  }

  function needsMyAction(sub: MockSubmission): boolean {
    if (!user) return false;
    const step = sub.workflowSteps.find((s) => s.status === "PENDING");
    if (!step || step.role !== user.role) return false;
    if (step.role === "EXAM_COMMITTEE" || step.role === "CO_ADVISOR") {
      if (!step.committeeMembers?.includes(user.id)) return false;
      return !(step.committeeActions ?? []).some((a) => a.userId === user.id);
    }
    return true;
  }

  function getPendingCount(role: Role): number {
    return submissions.filter((sub) => {
      const step = sub.workflowSteps.find((s) => s.status === "PENDING");
      if (step?.role !== role) return false;
      if ((role === "EXAM_COMMITTEE" || role === "CO_ADVISOR") && user) {
        if (!step.committeeMembers?.includes(user.id)) return false;
        return !(step.committeeActions ?? []).some((a) => a.userId === user.id);
      }
      return true;
    }).length;
  }

  async function refreshNotifications() {
    const notifs = await api<MockNotification[]>("/api/notifications");
    setNotifications(notifs);
  }

  async function markNotificationRead(id: string) {
    await api(`/api/notifications/${id}`, "PATCH");
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function markAllNotificationsRead() {
    await api("/api/notifications", "PATCH");
    setNotifications((prev) => prev.map((n) => (n.recipientId === user?.id ? { ...n, isRead: true } : n)));
  }

  async function adminSetNote(submissionId: string, note: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${submissionId}`, "PATCH", { action: "admin_set_note", note });
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? sub : s)));
  }

  async function adminUpdateSubmission(id: string, updates: { title?: string; advisorId?: string }) {
    const sub = await api<MockSubmission>(`/api/submissions/${id}`, "PATCH", { action: "admin_update", ...updates });
    setSubmissions((prev) => prev.map((s) => (s.id === id ? sub : s)));
  }

  async function adminDeleteSubmission(id: string) {
    await api(`/api/submissions/${id}`, "DELETE");
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }

  async function adminResetSubmission(id: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${id}`, "PATCH", { action: "admin_reset" });
    setSubmissions((prev) => prev.map((s) => (s.id === id ? sub : s)));
  }

  async function adminOverrideStep(submissionId: string, stepOrder: number, action: "APPROVED" | "REJECTED", notes?: string) {
    const sub = await api<MockSubmission>(`/api/submissions/${submissionId}`, "PATCH", { action: "admin_override_step", stepOrder, decision: action, notes });
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? sub : s)));
  }

  async function superAdminUpdateUserRole(userId: string, newRole: Role) {
    const updated = await api<MockUser>(`/api/users/${userId}`, "PATCH", { role: newRole });
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
  }

  async function superAdminDeleteUser(userId: string) {
    await api(`/api/users/${userId}`, "DELETE");
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  async function superAdminAddUser(userData: Omit<MockUser, "id">, password?: string) {
    const newUser = await api<MockUser>("/api/users", "POST", { ...userData, password });
    setUsers((prev) => [...prev, newUser]);
  }

  async function superAdminChangePassword(userId: string, newPassword: string) {
    await api(`/api/users/${userId}`, "PATCH", { password: newPassword });
  }

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      user, users, submissions, notifications, unreadCount, loading,
      logout, refresh,
      createSubmission, approveCurrentStep, rejectCurrentStep,
      addUpload, getPendingCount, studentResubmit, cancelSubmission,
      committeeSign, needsMyAction,
      markNotificationRead, markAllNotificationsRead,
      adminSetNote, adminUpdateSubmission, adminDeleteSubmission,
      adminResetSubmission, adminOverrideStep,
      superAdminUpdateUserRole, superAdminDeleteUser, superAdminAddUser, superAdminChangePassword,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
