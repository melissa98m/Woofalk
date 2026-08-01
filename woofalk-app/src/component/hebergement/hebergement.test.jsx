import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { test, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import Hebergement from "./hebergement";
import auth from "../../services/auth/token";

vi.mock("axios", () => ({
    default: { get: vi.fn() },
}));

vi.mock("../../services/auth/token", () => ({
    default: { loggedAndModerator: vi.fn() },
}));

vi.mock("./editHebergement", () => ({ default: () => <button>Modifier</button> }));
vi.mock("./deleteHebergement", () => ({ default: () => <button>Supprimer</button> }));

const HEBERGEMENTS = [{
    id: 1,
    hebergement_name: "Gîte du Chien",
    hebergement_description: "Un gîte sympa",
    hebergement_image: null,
    hebergement_website: null,
    price_indication: "€€",
    status: "publie",
    category: { id: 1, category_name: "Gîte" },
    address: { id: 1, address: "1 rue du Chien", city: "Paris", postal_code: "75001" },
    user: { id: 2, username: "bob" },
    tags: [],
    created_at: "2026-01-01T00:00:00.000000Z",
}];

beforeEach(() => {
    vi.resetAllMocks();
    axios.get.mockResolvedValue({ data: { data: HEBERGEMENTS } });
});

function renderHebergement() {
    return render(<MemoryRouter><Hebergement /></MemoryRouter>);
}

test("admin sees add/edit/delete controls and can bulk-delete", async () => {
    auth.loggedAndModerator.mockReturnValue(false);
    const user = userEvent.setup();
    renderHebergement();

    expect(await screen.findByText("Gîte du Chien")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajouter un hébergement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Sélectionner Gîte du Chien"));

    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer la sélection" })).toBeInTheDocument();
});

test("moderator only sees the status actions, not add/edit/delete", async () => {
    auth.loggedAndModerator.mockReturnValue(true);
    const user = userEvent.setup();
    renderHebergement();

    expect(await screen.findByText("Gîte du Chien")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ajouter un hébergement" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Sélectionner Gîte du Chien"));

    expect(screen.getByRole("button", { name: "Publier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mettre en attente" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer la sélection" })).not.toBeInTheDocument();
});
