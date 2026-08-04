import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { test, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import Place from "./place";
import auth from "../../services/auth/token";

vi.mock("axios", () => ({
    default: { get: vi.fn() },
}));

vi.mock("../../services/auth/token", () => ({
    default: { loggedAndModerator: vi.fn() },
}));

vi.mock("./editPlace", () => ({ default: () => <button>Modifier</button> }));
vi.mock("./deletePlace", () => ({ default: () => <button>Supprimer</button> }));

const PLACES = [{
    id: 1,
    place_name: "Le Parc",
    place_description: "Un parc sympa",
    place_image: null,
    status: "publie",
    category: { id: 1, category_name: "Parc" },
    address: { id: 1, address: "1 rue du Chien", city: "Paris", postal_code: "75001" },
    user: { id: 2, username: "bob" },
    tags: [],
    created_at: "2026-01-01T00:00:00.000000Z",
}];

beforeEach(() => {
    vi.resetAllMocks();
    axios.get.mockResolvedValue({ data: { data: PLACES } });
});

function renderPlace() {
    return render(<MemoryRouter><Place /></MemoryRouter>);
}

test("admin sees add/edit/delete controls and can bulk-delete", async () => {
    auth.loggedAndModerator.mockReturnValue(false);
    const user = userEvent.setup();
    renderPlace();

    expect(await screen.findByText("Le Parc")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajouter un lieu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Sélectionner Le Parc"));

    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer la sélection" })).toBeInTheDocument();
});

test("moderator only sees the status actions, not add/edit/delete", async () => {
    auth.loggedAndModerator.mockReturnValue(true);
    const user = userEvent.setup();
    renderPlace();

    expect(await screen.findByText("Le Parc")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ajouter un lieu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Sélectionner Le Parc"));

    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer la sélection" })).not.toBeInTheDocument();
});
