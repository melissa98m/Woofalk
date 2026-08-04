import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { test, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import Ballade from "./ballade";
import auth from "../../services/auth/token";

vi.mock("axios", () => ({
    default: { get: vi.fn() },
}));

vi.mock("../../services/auth/token", () => ({
    default: { loggedAndModerator: vi.fn() },
}));

vi.mock("./editBallade", () => ({ default: () => <button>Modifier</button> }));
vi.mock("./deleteBallade", () => ({ default: () => <button>Supprimer</button> }));

const BALLADES = [{
    id: 1,
    ballade_name: "Tour du lac",
    ballade_description: "Une belle balade",
    ballade_image: null,
    status: "publie",
    tags: [],
    distance: 5,
    denivele: 100,
    user: { id: 2, username: "bob" },
    created_at: "2026-01-01T00:00:00.000000Z",
}];

beforeEach(() => {
    vi.resetAllMocks();
    axios.get.mockResolvedValue({ data: { data: BALLADES } });
});

function renderBallade() {
    return render(<MemoryRouter><Ballade /></MemoryRouter>);
}

test("admin sees add/edit/delete controls and can bulk-delete", async () => {
    auth.loggedAndModerator.mockReturnValue(false);
    const user = userEvent.setup();
    renderBallade();

    expect(await screen.findByText("Tour du lac")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajouter une balade" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Sélectionner Tour du lac"));

    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer la sélection" })).toBeInTheDocument();
});

test("moderator only sees the status actions, not add/edit/delete", async () => {
    auth.loggedAndModerator.mockReturnValue(true);
    const user = userEvent.setup();
    renderBallade();

    expect(await screen.findByText("Tour du lac")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ajouter une balade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Sélectionner Tour du lac"));

    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer la sélection" })).not.toBeInTheDocument();
});
