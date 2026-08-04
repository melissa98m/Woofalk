import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { test, expect, vi, beforeEach } from "vitest";
import { CommentSection } from "./CommentSection";
import { getComments, addComment } from "../../../services/comment";
import auth from "../../../services/auth/token";

vi.mock("../../../services/comment", () => ({
    getComments: vi.fn(),
    addComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
}));

vi.mock("../../../services/auth/token", () => ({
    default: {
        loggedAndUser: vi.fn(),
        loggedAndAdmin: vi.fn(),
        loggedAndCanModerate: vi.fn(),
        getUserId: vi.fn(),
    },
}));

const COMMENTS = [
    {
        id: 1,
        body: "Super endroit !",
        created_at: "2026-01-01T00:00:00.000000Z",
        likes_count: 0,
        is_liked: false,
        user: { id: 2, username: "bob" },
    },
];

beforeEach(() => {
    vi.resetAllMocks();
    getComments.mockResolvedValue({ data: { data: COMMENTS } });
});

function renderSection() {
    return render(
        <MemoryRouter>
            <CommentSection type="places" id="1" />
        </MemoryRouter>
    );
}

test("guest sees a login prompt instead of the comment form", async () => {
    auth.loggedAndUser.mockReturnValue(false);
    auth.loggedAndCanModerate.mockReturnValue(false);
    auth.getUserId.mockReturnValue(false);
    renderSection();

    expect(await screen.findByText("Super endroit !")).toBeInTheDocument();
    expect(screen.getByText("Connectez-vous")).toBeInTheDocument();
    expect(screen.queryByLabelText("Laisser un commentaire")).not.toBeInTheDocument();
});

test("logged-in user can post a comment", async () => {
    auth.loggedAndUser.mockReturnValue(true);
    auth.loggedAndAdmin.mockReturnValue(false);
    auth.loggedAndCanModerate.mockReturnValue(false);
    auth.getUserId.mockReturnValue(5);
    addComment.mockResolvedValue({
        data: {
            data: {
                id: 2,
                body: "Génial pour les chiens",
                created_at: "2026-01-02T00:00:00.000000Z",
                likes_count: 0,
                is_liked: false,
                user: { id: 5, username: "moi" },
            },
        },
    });
    const user = userEvent.setup();
    renderSection();

    const field = await screen.findByLabelText("Laisser un commentaire");
    await user.type(field, "Génial pour les chiens");
    await user.click(screen.getByRole("button", { name: "Publier" }));

    expect(addComment).toHaveBeenCalledWith("places", "1", "Génial pour les chiens");
    expect(await screen.findByText("Génial pour les chiens")).toBeInTheDocument();
});

test("only the comment's author sees edit/delete controls", async () => {
    auth.loggedAndUser.mockReturnValue(true);
    auth.loggedAndAdmin.mockReturnValue(false);
    auth.loggedAndCanModerate.mockReturnValue(false);
    auth.getUserId.mockReturnValue(999);
    renderSection();

    await screen.findByText("Super endroit !");
    expect(screen.queryByLabelText("Modifier ce commentaire")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Supprimer ce commentaire")).not.toBeInTheDocument();
});

test("a moderator sees delete controls on comments they don't own", async () => {
    auth.loggedAndUser.mockReturnValue(false);
    auth.loggedAndAdmin.mockReturnValue(true);
    auth.loggedAndCanModerate.mockReturnValue(true);
    auth.getUserId.mockReturnValue(999);
    renderSection();

    await screen.findByText("Super endroit !");
    expect(screen.getByLabelText("Supprimer ce commentaire")).toBeInTheDocument();
    expect(screen.queryByLabelText("Modifier ce commentaire")).not.toBeInTheDocument();
});
