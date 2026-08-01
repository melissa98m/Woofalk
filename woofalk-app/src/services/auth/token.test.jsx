import { test, expect, beforeEach } from "vitest";
import auth from "./token";

const FUTURE = Date.now() / 1000 + 3600;
const PAST = Date.now() / 1000 - 3600;

function loginAs(roles) {
    auth.setSession({ id: 1, username: "test", email: "test@example.com", roles: JSON.stringify(roles) }, FUTURE);
}

beforeEach(() => {
    localStorage.clear();
});

test("no session: every logged-and-role check is false", () => {
    expect(auth.getExpiryTime()).toBe(false);
    expect(auth.loggedAndAdmin()).toBe(false);
    expect(auth.loggedAndUser()).toBe(false);
    expect(auth.loggedAndModerator()).toBe(false);
    expect(auth.loggedAndCanModerate()).toBe(false);
});

test("expired session is treated as logged out and cleared", () => {
    auth.setSession({ id: 1, username: "test", email: "test@example.com", roles: JSON.stringify(["ROLE_ADMIN"]) }, PAST);

    expect(auth.loggedAndAdmin()).toBe(false);
    expect(localStorage.getItem("auth_user")).toBeNull();
});

test("ROLE_USER session only passes loggedAndUser", () => {
    loginAs(["ROLE_USER"]);

    expect(auth.loggedAndUser()).toBe(true);
    expect(auth.loggedAndAdmin()).toBe(false);
    expect(auth.loggedAndModerator()).toBe(false);
    expect(auth.loggedAndCanModerate()).toBe(false);
});

test("ROLE_ADMIN session passes loggedAndAdmin and loggedAndCanModerate", () => {
    loginAs(["ROLE_ADMIN"]);

    expect(auth.loggedAndAdmin()).toBe(true);
    expect(auth.loggedAndUser()).toBe(false);
    expect(auth.loggedAndModerator()).toBe(false);
    expect(auth.loggedAndCanModerate()).toBe(true);
});

test("ROLE_MODERATOR session only passes loggedAndModerator and loggedAndCanModerate", () => {
    loginAs(["ROLE_MODERATOR"]);

    expect(auth.loggedAndModerator()).toBe(true);
    expect(auth.loggedAndCanModerate()).toBe(true);
    expect(auth.loggedAndAdmin()).toBe(false);
    expect(auth.loggedAndUser()).toBe(false);
});
