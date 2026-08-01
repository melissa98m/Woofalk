import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { test, expect, vi, beforeEach } from "vitest";
import { AdminLayout } from "./AdminLayout";
import auth from "../../../services/auth/token";

vi.mock("../../../services/auth/token", () => ({
    default: { loggedAndAdmin: vi.fn() },
}));

beforeEach(() => {
    vi.resetAllMocks();
});

function renderLayout() {
    render(
        <MemoryRouter initialEntries={["/admin/place"]}>
            <Routes>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="place" element={<div>Contenu lieux</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

test("admin sees every admin nav item", () => {
    auth.loggedAndAdmin.mockReturnValue(true);
    renderLayout();

    expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
    expect(screen.getByText("Utilisateurs")).toBeInTheDocument();
    expect(screen.getByText("Catégories")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByText("Lieux")).toBeInTheDocument();
    expect(screen.getByText("Balades")).toBeInTheDocument();
    expect(screen.getByText("Hébergements")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
});

test("moderator only sees the moderation-scoped nav items", () => {
    auth.loggedAndAdmin.mockReturnValue(false);
    renderLayout();

    expect(screen.queryByText("Tableau de bord")).not.toBeInTheDocument();
    expect(screen.queryByText("Utilisateurs")).not.toBeInTheDocument();
    expect(screen.queryByText("Catégories")).not.toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.queryByText("Export")).not.toBeInTheDocument();
    expect(screen.queryByText("Import")).not.toBeInTheDocument();
    expect(screen.getByText("Lieux")).toBeInTheDocument();
    expect(screen.getByText("Balades")).toBeInTheDocument();
    expect(screen.getByText("Hébergements")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
});
