import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { clerkClient } from "@clerk/nextjs/server";
import { AuthorizationDeniedError } from "../authorization/errors";
import { listOwnSessions, revokeOwnSession } from "./sessions";
import type { TaalimUser } from "./current-user";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));

const clerkClientMock = clerkClient as unknown as Mock;
const sessionsApi = {
  getSessionList: vi.fn(),
  getSession: vi.fn(),
  revokeSession: vi.fn(),
};

const actor: TaalimUser = {
  clerkSubject: "user_owner",
  sessionId: "sess_current",
  secondFactorVerified: false,
  account: { id: "acct_1", clerkSubject: "user_owner", roles: ["LEARNER"] },
};

beforeEach(() => {
  vi.clearAllMocks();
  clerkClientMock.mockResolvedValue({ sessions: sessionsApi });
});

describe("session management", () => {
  it("lists only the caller's own sessions", async () => {
    sessionsApi.getSessionList.mockResolvedValue({
      data: [
        {
          id: "sess_current",
          status: "active",
          createdAt: 1,
          lastActiveAt: 2,
          expireAt: 3,
          userId: "user_owner",
        },
        {
          id: "sess_other_device",
          status: "active",
          createdAt: 4,
          lastActiveAt: 5,
          expireAt: 6,
          userId: "user_owner",
        },
      ],
    });

    const sessions = await listOwnSessions(actor);

    expect(sessionsApi.getSessionList).toHaveBeenCalledWith({
      userId: "user_owner",
      status: "active",
    });
    expect(sessions).toHaveLength(2);
    expect(sessions[0].isCurrent).toBe(true);
    expect(sessions[1].isCurrent).toBe(false);
  });

  it("refuses to revoke a session the caller does not own", async () => {
    sessionsApi.getSession.mockResolvedValue({
      id: "sess_victim",
      userId: "user_victim",
    });

    await expect(revokeOwnSession(actor, "sess_victim")).rejects.toBeInstanceOf(
      AuthorizationDeniedError,
    );
    expect(sessionsApi.revokeSession).not.toHaveBeenCalled();
  });

  it("revokes an owned session", async () => {
    sessionsApi.getSession.mockResolvedValue({
      id: "sess_other_device",
      userId: "user_owner",
    });
    sessionsApi.revokeSession.mockResolvedValue({ id: "sess_other_device" });

    await revokeOwnSession(actor, "sess_other_device");

    expect(sessionsApi.revokeSession).toHaveBeenCalledWith("sess_other_device");
  });
});
