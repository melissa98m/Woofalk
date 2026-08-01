import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import Import from "./import";

vi.mock("axios", () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

const OPTIONS = [
    {
        key: "places",
        label: "Lieux",
        columns: [
            { name: "place_name", required: true },
            { name: "address", required: true },
        ],
    },
    {
        key: "categories",
        label: "Catégories",
        columns: [{ name: "category_name", required: true }],
    },
];

function csvFile(name = "data.csv") {
    return new File(["place_name,address\nLe Chien,1 rue du Chien"], name, { type: "text/csv" });
}

beforeEach(() => {
    vi.resetAllMocks();
    axios.get.mockResolvedValue({ data: { data: OPTIONS } });
});

test("loads and displays the importable resources", async () => {
    render(<Import />);

    expect(await screen.findByLabelText("Lieux")).toBeInTheDocument();
    expect(screen.getByLabelText("Catégories")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/api/import/options"));
});

test("disables the preview button until a file is chosen", async () => {
    render(<Import />);
    await screen.findByLabelText("Lieux");

    expect(screen.getByRole("button", { name: /aperçu/i })).toBeDisabled();
});

test("rejects a non-csv file client-side without calling the API", async () => {
    // A real browser's file picker already filters by the input's `accept`
    // attribute, but a user can still drag-and-drop or (on some browsers)
    // override that filter, so the component must validate the extension
    // itself too — bypass user-event's accept-matching to exercise that path.
    const user = userEvent.setup({ applyAccept: false });
    render(<Import />);
    await screen.findByLabelText("Lieux");

    const input = screen.getByLabelText(/choisir un fichier csv/i);
    await user.upload(input, new File(["x"], "malware.exe", { type: "application/x-msdownload" }));

    expect(await screen.findByText(/doit être un \.csv/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aperçu/i })).toBeDisabled();
});

test("runs a preview, shows the report, and only then enables commit", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValueOnce({
        data: { summary: { total: 1, toCreate: 1, toUpdate: 0, unchanged: 0, errors: 0 }, rows: [{ row: 2, action: "create", name: "Le Chien" }] },
    });
    render(<Import />);
    await screen.findByLabelText("Lieux");

    const input = screen.getByLabelText(/choisir un fichier csv/i);
    await user.upload(input, csvFile());

    const previewButton = screen.getByRole("button", { name: /aperçu/i });
    const commitButton = screen.getByRole("button", { name: /confirmer l'import/i });
    expect(previewButton).toBeEnabled();
    expect(commitButton).toBeDisabled();

    await user.click(previewButton);

    expect(await screen.findByText(/rien n'a été écrit en base/i)).toBeInTheDocument();
    expect(screen.getByText("1 création(s)")).toBeInTheDocument();
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/api/import/preview"), expect.any(FormData));
    await waitFor(() => expect(commitButton).toBeEnabled());
});

test("re-selecting a file after a preview disables commit again until re-previewed", async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValueOnce({
        data: { summary: { total: 1, toCreate: 1, toUpdate: 0, unchanged: 0, errors: 0 }, rows: [{ row: 2, action: "create", name: "Le Chien" }] },
    });
    render(<Import />);
    await screen.findByLabelText("Lieux");

    const input = screen.getByLabelText(/choisir un fichier csv/i);
    await user.upload(input, csvFile("first.csv"));
    await user.click(screen.getByRole("button", { name: /aperçu/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /confirmer l'import/i })).toBeEnabled());

    await user.upload(input, csvFile("second.csv"));

    expect(screen.getByRole("button", { name: /confirmer l'import/i })).toBeDisabled();
});

test("commit shows the final report on success", async () => {
    const user = userEvent.setup();
    axios.post
        .mockResolvedValueOnce({
            data: { summary: { total: 1, toCreate: 1, toUpdate: 0, unchanged: 0, errors: 0 }, rows: [{ row: 2, action: "create", name: "Le Chien" }] },
        })
        .mockResolvedValueOnce({
            data: { summary: { total: 1, toCreate: 1, toUpdate: 0, unchanged: 0, errors: 0 }, rows: [{ row: 2, action: "create", name: "Le Chien" }] },
        });
    render(<Import />);
    await screen.findByLabelText("Lieux");

    await user.upload(screen.getByLabelText(/choisir un fichier csv/i), csvFile());
    await user.click(screen.getByRole("button", { name: /aperçu/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /confirmer l'import/i })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: /confirmer l'import/i }));

    expect(await screen.findByText("Import terminé", { selector: "p" })).toBeInTheDocument();
    expect(axios.post).toHaveBeenLastCalledWith(expect.stringContaining("/api/import/commit"), expect.any(FormData));
});
