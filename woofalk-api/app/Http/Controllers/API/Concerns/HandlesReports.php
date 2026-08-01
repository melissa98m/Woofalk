<?php

namespace App\Http\Controllers\API\Concerns;

use App\Models\Report;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Shared by PlaceController/BalladeController/HebergementController's
 * report() endpoints: validates and records a report against the given
 * model, then flips it to "en_attente" once it accumulates
 * Report::THRESHOLD unresolved reports.
 */
trait HandlesReports
{
    protected function reportListing(Request $request, Model $model, string $cacheKey): JsonResponse
    {
        $validated = $request->validate([
            'subject' => ['required', Rule::in(Report::SUBJECTS)],
            'message' => ['nullable', 'string', 'max:1000', 'required_if:subject,'.Report::SUBJECT_OTHER],
        ]);

        $userId = Auth::id();

        if ($model->reports()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'Vous avez déjà signalé ce contenu.'], 409);
        }

        $model->reports()->create([
            'user_id' => $userId,
            'subject' => $validated['subject'],
            'message' => $validated['message'] ?? null,
        ]);

        $unresolvedCount = $model->reports()->whereNull('resolved_at')->count();

        if ($unresolvedCount >= Report::THRESHOLD && $model->status !== 'en_attente') {
            $model->status = 'en_attente';
            $model->save();
            $this->forgetListing($cacheKey);
        }

        return response()->json([
            'status' => 'Success',
            'is_reported' => true,
            'reports_count' => $unresolvedCount,
        ]);
    }
}
