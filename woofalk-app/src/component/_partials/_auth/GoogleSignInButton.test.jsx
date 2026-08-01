import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { test, expect, vi, beforeEach } from "vitest";
import GoogleSignInButton from "./GoogleSignInButton";

vi.mock("axios", () => ({
    default: { post: vi.fn() },
}));

const initialize = vi.fn();
const renderButton = vi.fn();

beforeEach(() => {
    vi.resetAllMocks();
    document.getElementById("google-identity-services")?.remove();
    window.google = { accounts: { id: { initialize, renderButton } } };
});

test("shows a disabled button until terms are accepted", () => {
    render(<GoogleSignInButton acceptTerms={false} onSuccess={vi.fn()} onError={vi.fn()} />);

    const button = screen.getByRole("button", { name: /continuer avec google/i });
    expect(button).toBeDisabled();
    expect(initialize).not.toHaveBeenCalled();
    expect(renderButton).not.toHaveBeenCalled();
});

test("initializes and renders the Google button once terms are accepted", async () => {
    render(<GoogleSignInButton acceptTerms={true} onSuccess={vi.fn()} onError={vi.fn()} />);

    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
    expect(renderButton).toHaveBeenCalledTimes(1);
    expect(initialize.mock.calls[0][0]).toHaveProperty("callback");
});

test("posts the credential to the API and reports success", async () => {
    const onSuccess = vi.fn();
    axios.post.mockResolvedValue({ data: { user: { id: 1 }, expires_at: 123 } });

    render(<GoogleSignInButton acceptTerms={true} onSuccess={onSuccess} onError={vi.fn()} />);
    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));

    const callback = initialize.mock.calls[0][0].callback;
    await callback({ credential: "fake-credential" });

    expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/google"),
        expect.any(FormData),
        expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, 123);
});

test("reports an error when the API call fails", async () => {
    const onError = vi.fn();
    axios.post.mockRejectedValue({ response: { data: { message: "Jeton Google invalide" } } });

    render(<GoogleSignInButton acceptTerms={true} onSuccess={vi.fn()} onError={onError} />);
    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));

    const callback = initialize.mock.calls[0][0].callback;
    await callback({ credential: "fake-credential" });

    expect(onError).toHaveBeenCalledWith("Jeton Google invalide");
});
