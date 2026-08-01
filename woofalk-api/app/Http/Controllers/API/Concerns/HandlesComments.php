<?php

namespace App\Http\Controllers\API\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Shared by PlaceController/BalladeController/HebergementController's
 * comments()/addComment() endpoints: lists and creates comments against the
 * given model. Editing/deleting a comment and liking/unliking one are handled
 * by CommentController instead, since those act on the comment directly and
 * don't need to know which resource it belongs to.
 */
trait HandlesComments
{
    protected function listComments(Model $model): JsonResponse
    {
        $comments = $model->comments()
            ->with('user:id,username')
            ->withCount('likedByUsers as likes_count')
            ->latest()
            ->get();

        $userId = Auth::id();
        $likedIds = $userId
            ? DB::table('comment_likes')->where('user_id', $userId)->pluck('comment_id')->all()
            : [];
        $comments->each(function ($comment) use ($likedIds) {
            $comment->is_liked = in_array($comment->id, $likedIds, true);
        });

        return response()->json([
            'status' => 'Success',
            'data' => $comments,
        ]);
    }

    protected function storeComment(Request $request, Model $model): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $comment = $model->comments()->create([
            'user_id' => Auth::id(),
            'body' => $validated['body'],
        ]);
        $comment->load('user:id,username');
        $comment->likes_count = 0;
        $comment->is_liked = false;

        return response()->json([
            'status' => 'Success',
            'data' => $comment,
        ]);
    }
}
