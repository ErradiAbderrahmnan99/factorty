<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
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
