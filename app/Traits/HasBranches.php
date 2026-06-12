<?php

namespace App\Traits;

use App\Models\Branche;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasBranches
{
    /**
     * Get all of the branches for the model.
     */
    public function branches(): MorphToMany
    {
        return $this->morphToMany(Branche::class, 'branchable');
    }
}
