<?php

use App\Models\Category;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['Plage', 'Restaurant', 'Visite'] as $categoryName) {
            Category::firstOrCreate(['category_name' => $categoryName]);
        }
    }

    public function down(): void
    {
        Category::whereIn('category_name', ['Plage', 'Restaurant', 'Visite'])->delete();
    }
};
