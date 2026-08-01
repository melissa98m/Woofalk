<?php

namespace Tests\Feature;

use App\Models\Ballade;
use App\Models\Hebergement;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use DatabaseTransactions;

    private function place(): Place
    {
        return Place::factory()->create(['status' => 'publie']);
    }

    public function test_user_can_post_a_comment_on_a_place(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $response = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/comments", [
            'body' => 'Super endroit pour promener mon chien !',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['data' => ['likes_count' => 0, 'is_liked' => false]]);
        $response->assertJsonFragment(['username' => $user->username]);
        $this->assertDatabaseHas('comments', [
            'commentable_type' => Place::class,
            'commentable_id' => $place->id,
            'user_id' => $user->id,
            'body' => 'Super endroit pour promener mon chien !',
        ]);
    }

    public function test_comment_body_is_required_and_capped(): void
    {
        $user = User::factory()->create();
        $place = $this->place();

        $missing = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/comments", []);
        $missing->assertStatus(422);

        $tooLong = $this->actingAs($user, 'api')->postJson("/api/places/{$place->id}/comments", [
            'body' => str_repeat('a', 1001),
        ]);
        $tooLong->assertStatus(422);
    }

    public function test_guest_cannot_post_a_comment(): void
    {
        $place = $this->place();

        $response = $this->postJson("/api/places/{$place->id}/comments", ['body' => 'Bonjour']);

        $response->assertStatus(401);
    }

    public function test_guest_can_list_comments(): void
    {
        $place = $this->place();
        $author = User::factory()->create();
        $place->comments()->create(['user_id' => $author->id, 'body' => 'Très bien noté']);

        $response = $this->getJson("/api/places/{$place->id}/comments");

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['body' => 'Très bien noté']);
    }

    public function test_comments_are_hidden_on_a_pending_place_for_the_public(): void
    {
        $place = Place::factory()->create(['status' => 'en_attente']);

        $response = $this->getJson("/api/places/{$place->id}/comments");

        $response->assertStatus(404);
    }

    public function test_author_can_edit_their_own_comment(): void
    {
        $author = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Version initiale']);

        $response = $this->actingAs($author, 'api')->patchJson("/api/comments/{$comment->id}", [
            'body' => 'Version corrigée',
        ]);

        $response->assertStatus(200);
        $this->assertSame('Version corrigée', $comment->fresh()->body);
    }

    public function test_another_user_cannot_edit_a_comment(): void
    {
        $author = User::factory()->create();
        $otherUser = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Version initiale']);

        $response = $this->actingAs($otherUser, 'api')->patchJson("/api/comments/{$comment->id}", [
            'body' => 'Tentative de modification',
        ]);

        $response->assertStatus(403);
        $this->assertSame('Version initiale', $comment->fresh()->body);
    }

    public function test_author_can_delete_their_own_comment(): void
    {
        $author = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'À supprimer']);

        $response = $this->actingAs($author, 'api')->deleteJson("/api/comments/{$comment->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_another_regular_user_cannot_delete_a_comment(): void
    {
        $author = User::factory()->create();
        $otherUser = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'À conserver']);

        $response = $this->actingAs($otherUser, 'api')->deleteJson("/api/comments/{$comment->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }

    public function test_moderator_can_delete_any_comment(): void
    {
        $author = User::factory()->create();
        $moderator = User::factory()->moderator()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Contenu à modérer']);

        $response = $this->actingAs($moderator, 'api')->deleteJson("/api/comments/{$comment->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_user_can_like_and_unlike_a_comment(): void
    {
        $author = User::factory()->create();
        $liker = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Commentaire aimé']);

        $like = $this->actingAs($liker, 'api')->postJson("/api/comments/{$comment->id}/like");
        $like->assertStatus(200);
        $like->assertJson(['is_liked' => true, 'likes_count' => 1]);
        $this->assertDatabaseHas('comment_likes', ['comment_id' => $comment->id, 'user_id' => $liker->id]);

        $unlike = $this->actingAs($liker, 'api')->deleteJson("/api/comments/{$comment->id}/like");
        $unlike->assertStatus(200);
        $unlike->assertJson(['is_liked' => false, 'likes_count' => 0]);
    }

    public function test_liking_a_comment_twice_does_not_duplicate(): void
    {
        $author = User::factory()->create();
        $liker = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Commentaire aimé']);

        $this->actingAs($liker, 'api')->postJson("/api/comments/{$comment->id}/like");
        $response = $this->actingAs($liker, 'api')->postJson("/api/comments/{$comment->id}/like");

        $response->assertStatus(200);
        $response->assertJson(['likes_count' => 1]);
    }

    public function test_guest_cannot_like_a_comment(): void
    {
        $author = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Commentaire']);

        $response = $this->postJson("/api/comments/{$comment->id}/like");

        $response->assertStatus(401);
    }

    public function test_user_can_comment_on_a_ballade_and_a_hebergement(): void
    {
        $user = User::factory()->create();
        $ballade = Ballade::factory()->create(['status' => 'publie']);
        $hebergement = Hebergement::factory()->create(['status' => 'publie']);

        $balladeResponse = $this->actingAs($user, 'api')->postJson("/api/ballades/{$ballade->id}/comments", ['body' => 'Belle balade']);
        $balladeResponse->assertStatus(200);
        $this->assertDatabaseHas('comments', ['commentable_type' => Ballade::class, 'commentable_id' => $ballade->id]);

        $hebergementResponse = $this->actingAs($user, 'api')->postJson("/api/hebergements/{$hebergement->id}/comments", ['body' => 'Accueillant pour les chiens']);
        $hebergementResponse->assertStatus(200);
        $this->assertDatabaseHas('comments', ['commentable_type' => Hebergement::class, 'commentable_id' => $hebergement->id]);
    }

    public function test_deleting_a_place_removes_its_comments(): void
    {
        $author = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Commentaire']);

        $place->delete();

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_bulk_destroy_places_also_deletes_their_comments(): void
    {
        $admin = User::factory()->admin()->create();
        $author = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Commentaire']);

        $this->actingAs($admin, 'api')->deleteJson('/api/places/bulk', ['ids' => [$place->id]]);

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_deleting_a_comment_removes_its_likes(): void
    {
        $author = User::factory()->create();
        $liker = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Commentaire']);
        $comment->likedByUsers()->attach($liker->id);

        $comment->delete();

        $this->assertDatabaseMissing('comment_likes', ['comment_id' => $comment->id]);
    }

    public function test_deleting_a_user_removes_their_comments(): void
    {
        $author = User::factory()->create();
        $place = $this->place();
        $comment = $place->comments()->create(['user_id' => $author->id, 'body' => 'Commentaire']);

        $author->delete();

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }
}
