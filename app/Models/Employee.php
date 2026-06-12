<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasBranches;

class Employee extends Model
{
    use HasBranches;

    protected $fillable = [
        'first_name',
        'last_name',
        'type',
        'department_id',
        'tele',
        'email',
        'adress',
        'cin',
        'birth_date',
        'gender',
        'country_id',
        'region_id',
        'city_id',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
