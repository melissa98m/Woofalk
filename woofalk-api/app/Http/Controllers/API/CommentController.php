<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Update the body of a comment the authenticated user owns.
     *
     * @return Response
     */
    public function update(Request $request, Comment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $comment->update(['body' => $validated['body']]);
        $comment->load('user:id,username');
        $comment->loadCount('likedByUsers as likes_count');
        $comment->is_liked = $comment->likedByUsers()->where('users.id', Auth::id())->exists();

        return response()->json([
            'status' => 'Success',
            'data' => $comment,
        ]);
    }

    /**
     * Delete a comment: its own author, or a moderator/admin moderating
     * content, may do so.
     *
     * @return Response
     */
    public function destroy(Comment $comment)
    {
        $user = Auth::user();
        if ($comment->user_id !== $user->id && ! Roles::canModerate($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $comment->delete();

        return response()->json(['status' => 'Success']);
    }

    /**
     * Like the specified comment on behalf of the authenticated user.
     *
     * @return Response
     */
    public function like(Comment $comment)
    {
        $comment->likedByUsers()->syncWithoutDetaching([Auth::id()]);

        return response()->json([
            'status' => 'Success',
            'is_liked' => true,
            'likes_count' => $comment->likedByUsers()->count(),
        ]);
    }

    /**
     * Remove the authenticated user's like from the specified comment.
     *
     * @return Response
     */
    public function unlike(Comment $comment)
    {
        $comment->likedByUsers()->detach(Auth::id());

        return response()->json([
            'status' => 'Success',
            'is_liked' => false,
            'likes_count' => $comment->likedByUsers()->count(),
        ]);
    }
}
