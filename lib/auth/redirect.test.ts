import { describe, expect, it } from "vitest";
import {
  resolvePostLoginRedirect,
  isSafeAdminRedirectPath,
  ADMIN_DASHBOARD_PATH,
  ADMIN_SETTINGS_MUST_CHANGE_PATH,
  EMPLOYEE_DASHBOARD_PATH,
} from "./redirect";

describe("resolvePostLoginRedirect", () => {
  it("sends an admin with completed setup to the dashboard", () => {
    expect(resolvePostLoginRedirect({ kind: "admin", mustChangePassword: false })).toBe(ADMIN_DASHBOARD_PATH);
  });

  it("sends an admin who must change their password to the settings page", () => {
    expect(resolvePostLoginRedirect({ kind: "admin", mustChangePassword: true })).toBe(ADMIN_SETTINGS_MUST_CHANGE_PATH);
  });

  it("prioritizes the forced password change over any next= target", () => {
    // A stale ?next= from before a forced reset must never let a user skip it.
    expect(resolvePostLoginRedirect({ kind: "admin", mustChangePassword: true, next: "/admin/customers" }))
      .toBe(ADMIN_SETTINGS_MUST_CHANGE_PATH);
  });

  it("always sends an employee to the employee dashboard, regardless of any next=", () => {
    expect(resolvePostLoginRedirect({ kind: "employee", next: "/admin/settings" })).toBe(EMPLOYEE_DASHBOARD_PATH);
  });

  it("returns to a safe, previously-captured admin page after login", () => {
    expect(resolvePostLoginRedirect({ kind: "admin", mustChangePassword: false, next: "/admin/customers" }))
      .toBe("/admin/customers");
  });

  it("falls back to the dashboard when next= is missing", () => {
    expect(resolvePostLoginRedirect({ kind: "admin", mustChangePassword: false, next: null })).toBe(ADMIN_DASHBOARD_PATH);
  });

  it.each([
    "https://evil.example.com/admin/dashboard",
    "//evil.example.com/admin/dashboard",
    "/not-admin/dashboard",
    "javascript://admin/dashboard",
    "",
  ])("rejects an unsafe next= value (%s) and falls back to the dashboard", (unsafeNext) => {
    expect(resolvePostLoginRedirect({ kind: "admin", mustChangePassword: false, next: unsafeNext })).toBe(ADMIN_DASHBOARD_PATH);
  });
});

describe("isSafeAdminRedirectPath", () => {
  it("accepts relative /admin/ paths", () => {
    expect(isSafeAdminRedirectPath("/admin/customers")).toBe(true);
    expect(isSafeAdminRedirectPath("/admin/settings?foo=bar")).toBe(true);
  });

  it("rejects open-redirect attempts", () => {
    expect(isSafeAdminRedirectPath("https://evil.example.com")).toBe(false);
    expect(isSafeAdminRedirectPath("//evil.example.com")).toBe(false);
    expect(isSafeAdminRedirectPath(null)).toBe(false);
    expect(isSafeAdminRedirectPath(undefined)).toBe(false);
    expect(isSafeAdminRedirectPath("/booking/some-tenant")).toBe(false);
  });
});
