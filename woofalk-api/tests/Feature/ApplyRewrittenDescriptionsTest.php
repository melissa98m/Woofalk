<?php

namespace Tests\Feature;

use App\Models\Ballade;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ApplyRewrittenDescriptionsTest extends TestCase
{
    use DatabaseTransactions;

    private function unique(string $label): string
    {
        return $label.' '.bin2hex(random_bytes(4));
    }

    private function jsonFile(array $entries): string
    {
        $path = tempnam(sys_get_temp_dir(), 'rewritten').'.json';
        file_put_contents($path, json_encode($entries));

        return $path;
    }

    public function test_it_applies_rewritten_descriptions_and_stamps_them(): void
    {
        $ballade = Ballade::create([
            'ballade_name' => $this->unique('Boucle du chien'),
            'ballade_description' => 'Description originale.',
            'ballade_latitude' => 48.85,
            'ballade_longitude' => 2.35,
            'status' => 'publie',
        ]);
        $file = $this->jsonFile([['id' => $ballade->id, 'description' => 'Nouvelle description écrite à la main.']]);

        $this->artisan("descriptions:apply ballades {$file}")->assertExitCode(0);

        $ballade->refresh();
        $this->assertSame('Nouvelle description écrite à la main.', $ballade->ballade_description);
        $this->assertNotNull($ballade->description_rewritten_at);
    }

    public function test_it_skips_entries_missing_a_description_without_failing_the_batch(): void
    {
        $ballade = Ballade::create([
            'ballade_name' => $this->unique('Boucle du chien'),
            'ballade_description' => 'Description originale.',
            'ballade_latitude' => 48.85,
            'ballade_longitude' => 2.35,
            'status' => 'publie',
        ]);
        $file = $this->jsonFile([
            ['id' => $ballade->id, 'description' => ''],
            ['id' => 999999999, 'description' => 'Fiche inexistante.'],
        ]);

        $this->artisan("descriptions:apply ballades {$file}")->assertExitCode(0);

        $ballade->refresh();
        $this->assertSame('Description originale.', $ballade->ballade_description);
        $this->assertNull($ballade->description_rewritten_at);
    }

    public function test_it_rejects_an_unknown_type(): void
    {
        $file = $this->jsonFile([]);

        $this->artisan("descriptions:apply chats {$file}")->assertExitCode(1);
    }

    public function test_it_rejects_a_missing_file(): void
    {
        $this->artisan('descriptions:apply ballades /tmp/does-not-exist.json')->assertExitCode(1);
    }
}
