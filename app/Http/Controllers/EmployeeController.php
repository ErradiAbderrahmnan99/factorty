<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Employee/Index', [
            'employees' => Employee::orderBy('last_name')->orderBy('first_name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'type'       => ['required', 'string', 'in:commercial,agent,employé'],
            'tele'       => ['nullable', 'string', 'max:50'],
            'email'      => ['nullable', 'email', 'max:255'],
            'adress'     => ['nullable', 'string'],
            'cin'        => ['nullable', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date'],
            'gender'     => ['nullable', 'string', 'in:homme,femme'],
        ]);

        Employee::create($request->only([
            'first_name', 'last_name', 'type', 'tele', 'email', 'adress', 'cin', 'birth_date', 'gender'
        ]));

        return back()->with('success', 'Employé créé avec succès.');
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'type'       => ['required', 'string', 'in:commercial,agent,employé'],
            'tele'       => ['nullable', 'string', 'max:50'],
            'email'      => ['nullable', 'email', 'max:255'],
            'adress'     => ['nullable', 'string'],
            'cin'        => ['nullable', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date'],
            'gender'     => ['nullable', 'string', 'in:homme,femme'],
        ]);

        $employee->update($request->only([
            'first_name', 'last_name', 'type', 'tele', 'email', 'adress', 'cin', 'birth_date', 'gender'
        ]));

        return back()->with('success', 'Employé mis à jour.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();
        return back()->with('success', 'Employé supprimé.');
    }
}
