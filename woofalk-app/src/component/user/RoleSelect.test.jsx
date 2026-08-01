import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import RoleSelect from "./RoleSelect";

vi.mock("axios", () => ({
    default: { patch: vi.fn() },
}));

beforeEach(() => {
    vi.resetAllMocks();
});

test("shows the current role", () => {
    render(<RoleSelect id={2} username="bob" roles={["ROLE_MODERATOR"]} isSelf={false} onRoleChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Modérateur");
});

test("promoting a user calls the roles endpoint and reports success", async () => {
    const user = userEvent.setup();
    axios.patch.mockResolvedValueOnce({ data: { data: { roles: '["ROLE_MODERATOR"]' } } });
    const onRoleChange = vi.fn();
    render(<RoleSelect id={2} username="bob" roles={["ROLE_USER"]} isSelf={false} onRoleChange={onRoleChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Modérateur" }));

    expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/2/roles"),
        { roles: ["ROLE_MODERATOR"] }
    );
    expect(onRoleChange).toHaveBeenCalledWith(2, '["ROLE_MODERATOR"]', null);
});

test("a failed role change reports the API error message instead of updating", async () => {
    const user = userEvent.setup();
    axios.patch.mockRejectedValueOnce({ response: { data: { message: "Vous ne pouvez pas modifier votre propre rôle" } } });
    const onRoleChange = vi.fn();
    render(<RoleSelect id={5} username="admin" roles={["ROLE_USER"]} isSelf={false} onRoleChange={onRoleChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Administrateur" }));

    expect(onRoleChange).toHaveBeenCalledWith(5, null, "Vous ne pouvez pas modifier votre propre rôle");
});

test("is disabled for the acting admin's own row", () => {
    render(<RoleSelect id={1} username="me" roles={["ROLE_ADMIN"]} isSelf onRoleChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
});
